<script setup lang="ts">
import { ref } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Upload, Hash, Loader2, Sparkles } from 'lucide-vue-next'

const store = useBeadStore()

// --- 状态定义 ---
const gridSize = ref(29)
const imagePreview = ref<string | null>(null)
const beadGrid = ref<any[][]>([])
const colorStats = ref<Record<string, any>>({})
const isProcessing = ref(false)

// --- 核心算法：色号匹配 ---
const getNearestBead = (r: number, g: number, b: number) => {
  let minDistance = Infinity
  let nearest = store.palette[0]

  for (const bead of store.palette) {
    const distance = Math.sqrt(
        Math.pow(r - bead.rgb[0], 2) +
        Math.pow(g - bead.rgb[1], 2) +
        Math.pow(b - bead.rgb[2], 2)
    )
    if (distance < minDistance) {
      minDistance = distance
      nearest = bead
    }
  }
  return { ...nearest, isDone: false }
}

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  isProcessing.value = true
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
    processImage(imagePreview.value)
  }
  reader.readAsDataURL(file)
}

const processImage = (src: string) => {
  const img = new Image()
  img.src = src
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = gridSize.value
    canvas.height = gridSize.value
    ctx.drawImage(img, 0, 0, gridSize.value, gridSize.value)

    const imageData = ctx.getImageData(0, 0, gridSize.value, gridSize.value).data
    const newGrid: any[][] = []
    const stats: Record<string, any> = {}

    for (let y = 0; y < gridSize.value; y++) {
      const row: any[] = []
      for (let x = 0; x < gridSize.value; x++) {
        const i = (y * gridSize.value + x) * 4
        const matched = getNearestBead(imageData[i], imageData[i+1], imageData[i+2])
        row.push(matched)

        if (!stats[matched.id]) {
          stats[matched.id] = { ...matched, count: 0 }
        }
        stats[matched.id].count++
      }
      newGrid.push(row)
    }
    beadGrid.value = newGrid
    colorStats.value = stats
    isProcessing.value = false
  }
}

const checkStock = (id: string, needed: number) => {
  const current = store.getStock(id)
  return {
    isEnough: current >= needed,
    shortage: needed - current
  }
}

const toggleBead = (y: number, x: number) => {
  beadGrid.value[y][x].isDone = !beadGrid.value[y][x].isDone
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <!-- 左侧区域 -->
    <div class="lg:col-span-4 space-y-6">
      <!-- 上传组件 -->
      <div v-if="!imagePreview" class="border-2 border-dashed border-slate-200 bg-white rounded-[32px] p-12 text-center transition-all hover:border-blue-400">
        <input type="file" id="fileInput" class="hidden" @change="handleFileUpload" accept="image/*" />
        <label for="fileInput" class="cursor-pointer flex flex-col items-center">
          <Upload :size="48" class="text-blue-500 mb-4" />
          <span class="font-bold text-slate-700">点击上传 MARD 原图</span>
        </label>
      </div>

      <!-- 库存清单 -->
      <div v-if="Object.keys(colorStats).length" class="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold mb-4 flex items-center gap-2">
          <Hash :size="18" class="text-blue-600" /> 豆子需求清单
        </h3>
        <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="item in colorStats" :key="item.id"
               class="flex items-center justify-between p-3 rounded-2xl border"
               :class="checkStock(item.id, item.count).isEnough ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'">
            <div class="flex items-center gap-3">
              <div :style="{ backgroundColor: item.hex }" class="w-10 h-10 rounded-xl shadow-inner border border-black/10 flex items-center justify-center text-[10px] font-bold text-white">
                {{ item.id }}
              </div>
              <div>
                <div class="text-sm font-bold text-slate-800">{{ item.id }}</div>
                <div class="text-[10px] text-slate-500">需: {{ item.count }} / 余: {{ store.getStock(item.id) }}</div>
              </div>
            </div>
            <div v-if="!checkStock(item.id, item.count).isEnough" class="text-xs font-black text-red-600">
              缺 {{ checkStock(item.id, item.count).shortage }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧区域 -->
    <div class="lg:col-span-8">
      <div class="bg-slate-900 rounded-[40px] p-4 md:p-8 min-h-[600px] flex items-center justify-center relative shadow-2xl">
        <!-- 处理中状态 -->
        <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20 rounded-[40px]">
          <Loader2 class="animate-spin text-blue-500" :size="48" />
        </div>

        <!-- 拼豆网格 -->
        <div v-if="beadGrid.length" class="bead-canvas w-full max-w-[550px]" :style="{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '1px'
        }">
          <template v-for="(row, y) in beadGrid" :key="y">
            <div v-for="(bead, x) in row" :key="x"
                 @click="toggleBead(y, x)"
                 class="aspect-square rounded-full cursor-pointer transition-all border border-black/10"
                 :style="{
                   backgroundColor: bead.hex,
                   opacity: bead.isDone ? 0.2 : 1,
                   transform: bead.isDone ? 'scale(0.8)' : 'scale(1)'
                 }">
            </div>
          </template>
        </div>

        <!-- 空状态 -->
        <div v-else class="text-slate-600 flex flex-col items-center gap-4 text-center">
          <Sparkles :size="48" class="text-slate-700" />
          <p class="font-medium">上传图片生成 MARD 专用图纸</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.bead-canvas {
  aspect-ratio: 1 / 1;
}
</style>