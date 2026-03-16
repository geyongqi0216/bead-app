<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Upload, Loader2, Sparkles, Download, Printer } from 'lucide-vue-next'

const store = useBeadStore()

// --- 状态定义 ---
const gridSize = ref(52) // 默认调为 52x52 匹配你的图片需求
const imagePreview = ref<string | null>(null)
const beadGrid = ref<any[][]>([])
const colorStats = ref<Record<string, any>>({})
const isProcessing = ref(false)

// 生成标尺数组
const rulerArray = computed(() => Array.from({ length: gridSize.value }, (_, i) => i + 1))

// --- 核心算法：色号匹配 ---
const getNearestBead = (r: number, g: number, b: number) => {
  let minDistance = Infinity
  let nearest = store.palette[0]

  for (const bead of store.palette) {
    const distance = Math.sqrt(
        Math.pow(r - bead.rgb[0], 2) + Math.pow(g - bead.rgb[1], 2) + Math.pow(b - bead.rgb[2], 2)
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

// 打印功能
const printChart = () => {
  window.print()
}
</script>

<template>
  <div class="flex flex-col gap-6 pb-20">
    <!-- 顶部控制栏 -->
    <div class="flex flex-col md:flex-row gap-4 justify-between bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 no-print">
      <div class="flex items-center gap-4">
        <div class="flex flex-col">
          <span class="text-xs font-bold text-slate-400">网格规格</span>
          <select v-model.number="gridSize" class="bg-transparent font-black text-blue-600 outline-none">
            <option :value="29">29 x 29 (小)</option>
            <option :value="52">52 x 52 (大)</option>
            <option :value="80">80 x 80 (特大)</option>
          </select>
        </div>
        <div class="h-8 w-px bg-slate-100" />
        <label class="cursor-pointer bg-blue-50 text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2">
          <Upload :size="18" /> 上传图片
          <input type="file" class="hidden" @change="handleFileUpload" accept="image/*" />
        </label>
      </div>

      <div v-if="beadGrid.length" class="flex gap-2">
        <button @click="printChart" class="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer">
          <Printer :size="18" /> 打印图纸
        </button>
      </div>
    </div>

    <!-- 主要内容区：图纸渲染 -->
    <div class="bg-white rounded-[40px] p-2 md:p-8 shadow-sm border border-slate-100 overflow-x-auto min-h-[600px] relative print:p-0 print:shadow-none print:border-none">

      <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
        <Loader2 class="animate-spin text-blue-500" :size="48" />
      </div>

      <!-- 专业图纸容器：包含标尺 -->
      <div v-if="beadGrid.length" class="relative inline-block mx-auto">

        <!-- 顶部数字标尺 -->
        <div class="flex ml-8">
          <div v-for="n in rulerArray" :key="n"
               class="flex items-center justify-center font-mono text-[8px] text-slate-400 border-r border-slate-100"
               :style="{ width: '16px', height: '20px' }">
            {{ n }}
          </div>
        </div>

        <div class="flex">
          {/* 左侧数字标尺 */}
          <div class="flex flex-col">
            <div v-for="n in rulerArray" :key="n"
                 class="flex items-center justify-center font-mono text-[8px] text-slate-400 border-b border-slate-100"
                 :style="{ width: '32px', height: '16px' }">
              {{ n }}
            </div>
          </div>

          {/* 核心网格 */}
          <div class="border-t border-l border-slate-900" :style="{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 16px)`,
            backgroundColor: '#fff'
          }">
            <template v-for="(row, y) in beadGrid" :key="y">
              <div v-for="(bead, x) in row" :key="x"
                   @click="bead.isDone = !bead.isDone"
                   class="relative flex items-center justify-center border-r border-b border-slate-900 aspect-square cursor-pointer transition-all hover:opacity-50"
                   :style="{ backgroundColor: bead.isDone ? '#f1f5f9' : bead.hex }">

                <!-- 格子内的色号文字 -->
                <span class="text-[5px] font-bold pointer-events-none uppercase leading-none"
                      :style="{ color: getContrastColor(bead.hex), opacity: bead.isDone ? 0.2 : 1 }">
                  {{ bead.id }}
                </span>

                <!-- 完成标记 -->
                <div v-if="bead.isDone" class="absolute inset-0 flex items-center justify-center text-[8px] text-slate-400 font-black">
                  /
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-else class="text-slate-400 flex flex-col items-center justify-center gap-4 py-20">
        <Sparkles :size="64" class="opacity-20" />
        <p class="font-bold">上传一张图片，我们将为您生成 MARD 专业级标尺图纸</p>
      </div>

      <!-- 底部清单：颜色明细 (Legend) -->
      <div v-if="Object.keys(colorStats).length" class="mt-12 pt-8 border-t border-slate-100">
        <div class="flex flex-wrap gap-4">
          <div v-for="item in Object.values(colorStats).sort((a,b) => a.id.localeCompare(b.id, undefined, {numeric: true}))" :key="item.id"
               class="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
            <div :style="{ backgroundColor: item.hex }" class="w-8 h-8 rounded-lg shadow-inner border border-black/5 flex items-center justify-center font-black text-[10px] text-white outline-1 outline-black/10">
              {{ item.id }}
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-black text-slate-800">{{ item.id }}</span>
              <span class="text-[10px] font-bold text-slate-400">{{ item.count }} 颗</span>
            </div>
          </div>
        </div>
        <p class="mt-8 text-xs text-slate-300 font-medium">* 颜色为软件匹配直出，仅供参考，请以 MARD 物理色号为准。</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// 辅助函数：根据背景色自动切换文字颜色 (黑或白)
function getContrastColor(hexcolor: string) {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}
</script>

<style scoped>
/* 打印优化 */
@media print {
  .no-print { display: none !important; }
  body { background: white !important; }
}

.bead-canvas {
  image-rendering: pixelated;
}
</style>