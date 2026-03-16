<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Upload, Loader2, Sparkles, Printer, Eraser, MousePointer2, Trash2 } from 'lucide-vue-next'

const store = useBeadStore()

// --- 状态定义 ---
const gridSize = ref(52)
const imagePreview = ref<string | null>(null)
const beadGrid = ref<any[][]>([])
const colorStats = ref<Record<string, any>>({})
const isProcessing = ref(false)
const isEraserMode = ref(false) // 橡皮擦模式开关

// 生成标尺数组
const rulerArray = computed(() => Array.from({ length: gridSize.value }, (_, i) => i + 1))

// --- 核心算法：色号匹配 ---
const getNearestBead = (r: number, g: number, b: number, a: number) => {
  // 1. 自动识别透明背景或纯白背景
  // 如果透明度极低，或者颜色非常接近纯白（250以上），标记为空白
  if (a < 10 || (r > 250 && g > 250 && b > 250)) {
    return { id: '', hex: 'transparent', isEmpty: true, isDone: false }
  }

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
  return { ...nearest, isEmpty: false, isDone: false }
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
        // 传入 RGBA
        const matched = getNearestBead(imageData[i], imageData[i+1], imageData[i+2], imageData[i+3])
        row.push(matched)

        if (!matched.isEmpty) {
          if (!stats[matched.id]) {
            stats[matched.id] = { ...matched, count: 0 }
          }
          stats[matched.id].count++
        }
      }
      newGrid.push(row)
    }
    beadGrid.value = newGrid
    colorStats.value = stats
    isProcessing.value = false
  }
}

// 点击格子逻辑
const handleCellClick = (y: number, x: number) => {
  const bead = beadGrid.value[y][x]
  if (isEraserMode.value) {
    // 橡皮擦模式：切换为空白/非空白
    if (!bead.isEmpty) {
      bead.isEmpty = true
      // 更新统计
      if (colorStats.value[bead.id]) colorStats.value[bead.id].count--
    } else {
      // 如果是空的，点击由于没有原始颜色信息，通常不建议恢复，或可做撤销
      toast('已抹除')
    }
  } else {
    // 正常模式：标记已完成
    if (!bead.isEmpty) {
      bead.isDone = !bead.isDone
    }
  }
}

const printChart = () => window.print()
</script>

<template>
  <div class="flex flex-col gap-6 pb-20">
    <!-- 顶部控制栏 -->
    <div class="flex flex-col md:flex-row gap-4 justify-between bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 no-print">
      <div class="flex items-center gap-4">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-slate-400">网格规格</span>
          <select v-model.number="gridSize" class="bg-transparent font-black text-blue-600 outline-none">
            <option :value="29">29 x 29</option>
            <option :value="52">52 x 52</option>
            <option :value="80">80 x 80</option>
          </select>
        </div>
        <div class="h-8 w-px bg-slate-100" />
        <label class="cursor-pointer bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2">
          <Upload :size="18" /> 上传图片
          <input type="file" class="hidden" @change="handleFileUpload" accept="image/*" />
        </label>
      </div>

      <div v-if="beadGrid.length" class="flex gap-2">
        <!-- 橡皮擦切换 -->
        <button
            @click="isEraserMode = !isEraserMode"
            :class="isEraserMode ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'"
            class="flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all cursor-pointer"
        >
          <Eraser v-if="isEraserMode" :size="18" />
          <MousePointer2 v-else :size="18" />
          {{ isEraserMode ? '橡皮擦开启' : '普通模式' }}
        </button>

        <button @click="printChart" class="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer">
          <Printer :size="18" /> 打印图纸
        </button>
      </div>
    </div>

    <!-- 图纸区域 -->
    <div class="bg-white rounded-[40px] p-2 md:p-8 shadow-sm border border-slate-100 overflow-x-auto min-h-[600px] relative print:p-0">

      <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
        <Loader2 class="animate-spin text-blue-500" :size="48" />
      </div>

      <div v-if="beadGrid.length" class="relative inline-block mx-auto select-none">

        <!-- 顶部标尺 -->
        <div class="flex ml-8">
          <div v-for="n in rulerArray" :key="n"
               class="flex items-center justify-center font-mono text-[8px] text-slate-400 border-r border-slate-100"
               :style="{ width: '16px', height: '20px' }">
            {{ n % 5 === 0 ? n : '' }}
          </div>
        </div>

        <div class="flex">
          <!-- 左侧标尺 -->
          <div class="flex flex-col">
            <div v-for="n in rulerArray" :key="n"
                 class="flex items-center justify-center font-mono text-[8px] text-slate-400 border-b border-slate-100"
                 :style="{ width: '32px', height: '16px' }">
              {{ n % 5 === 0 ? n : '' }}
            </div>
          </div>

          <!-- 网格主体 -->
          <div class="border-t border-l border-slate-900" :style="{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 16px)`,
            backgroundColor: '#fff'
          }">
            <template v-for="(row, y) in beadGrid" :key="y">
              <div v-for="(bead, x) in row" :key="x"
                   @click="handleCellClick(y, x)"
                   class="relative flex items-center justify-center border-r border-b border-slate-200 aspect-square cursor-pointer"
                   :class="bead.isEmpty ? 'bg-slate-50/50' : ''"
                   :style="{
                     backgroundColor: bead.isEmpty ? 'transparent' : (bead.isDone ? '#f1f5f9' : bead.hex),
                     borderColor: (x + 1) % 5 === 0 || (y + 1) % 5 === 0 ? '#334155' : '#e2e8f0'
                   }">

                <!-- 只有非空格子才显示 ID -->
                <span v-if="!bead.isEmpty" class="text-[5px] font-bold pointer-events-none uppercase"
                      :style="{ color: getContrastColor(bead.hex), opacity: bead.isDone ? 0.1 : 1 }">
                  {{ bead.id }}
                </span>

                <!-- 完成标记 -->
                <div v-if="bead.isDone" class="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300">/</div>

                <!-- 橡皮擦预览 -->
                <div v-if="isEraserMode && !bead.isEmpty" class="absolute inset-0 bg-red-500/10 hover:bg-red-500/40 transition-colors"></div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-else class="text-slate-400 flex flex-col items-center justify-center gap-4 py-20">
        <Sparkles :size="64" class="opacity-20" />
        <p class="font-bold">上传一张图片，自动过滤背景并生成图纸</p>
      </div>

      <!-- 底部清单 -->
      <div v-if="Object.keys(colorStats).length" class="mt-12 pt-8 border-t border-slate-100">
        <div class="flex flex-wrap gap-4">
          <div v-for="item in Object.values(colorStats).filter(i => i.count > 0).sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true}))" :key="item.id"
               class="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div :style="{ backgroundColor: item.hex }" class="w-8 h-8 rounded-lg shadow-inner border border-black/5 flex items-center justify-center font-black text-[10px] text-white">
              {{ item.id }}
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-black text-slate-800">{{ item.id }}</span>
              <span class="text-[10px] font-bold text-slate-400">{{ item.count }} 颗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
function getContrastColor(hexcolor: string) {
  if (hexcolor === 'transparent') return '#000';
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}
</script>

<style scoped>
@media print {
  .no-print { display: none !important; }
}
</style>