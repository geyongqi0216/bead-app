<script setup lang="ts">
import { ref } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Upload, Hash, Loader2, Sparkles, Download } from 'lucide-vue-next'

const store = useBeadStore()
const gridSize = ref(29)
const imagePreview = ref<string | null>(null)
const beadGrid = ref<any[][]>([])
const colorStats = ref<Record<string, any>>({})
const isProcessing = ref(false)

const getNearestBead = (r: number, g: number, b: number) => {
  let minDistance = Infinity
  let nearest = store.palette[0]
  for (const bead of store.palette) {
    const d = Math.sqrt(Math.pow(r-bead.rgb[0],2)+Math.pow(g-bead.rgb[1],2)+Math.pow(b-bead.rgb[2],2))
    if (d < minDistance) { minDistance = d; nearest = bead; }
  }
  return { ...nearest, isDone: false }
}

const handleFileUpload = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  isProcessing.value = true
  const reader = new FileReader()
  reader.onload = (ev) => {
    imagePreview.value = ev.target?.result as string
    const img = new Image()
    img.src = imagePreview.value
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = gridSize.value; canvas.height = gridSize.value
      ctx.drawImage(img, 0, 0, gridSize.value, gridSize.value)
      const data = ctx.getImageData(0, 0, gridSize.value, gridSize.value).data
      const newGrid: any[][] = []; const stats: Record<string, any> = {}
      for (let y = 0; y < gridSize.value; y++) {
        const row = []
        for (let x = 0; x < gridSize.value; x++) {
          const i = (y * gridSize.value + x) * 4
          const m = getNearestBead(data[i], data[i+1], data[i+2])
          row.push(m)
          if (!stats[m.id]) stats[m.id] = { ...m, count: 0 }
          stats[m.id].count++
        }
        newGrid.push(row)
      }
      beadGrid.value = newGrid; colorStats.value = stats; isProcessing.value = false
    }
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div class="lg:col-span-4 space-y-6">
      <div v-if="!imagePreview" class="border-2 border-dashed border-slate-200 bg-white rounded-[32px] p-12 text-center">
        <input type="file" id="fileIn" class="hidden" @change="handleFileUpload" accept="image/*" />
        <label for="fileIn" class="cursor-pointer flex flex-col items-center">
          <Upload :size="48" class="text-blue-500 mb-4" />
          <span class="font-bold text-slate-700">上传 MARD 图片</span>
        </label>
      </div>
      <div v-if="Object.keys(colorStats).length" class="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <h3 class="font-bold mb-4 flex items-center gap-2"><Hash :size="18" /> 需求清单</h3>
        <div class="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <div v-for="item in colorStats" :key="item.id" class="flex items-center justify-between p-3 rounded-2xl border"
               :class="store.getStock(item.id) >= item.count ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-100'">
            <div class="flex items-center gap-3">
              <div :style="{ backgroundColor: item.hex }" class="w-10 h-10 rounded-xl shadow-inner border border-black/5 flex items-center justify-center text-[10px] font-bold text-white">{{ item.id }}</div>
              <div class="text-sm font-bold">{{ item.id }} ({{ item.count }}颗)</div>
            </div>
            <div v-if="store.getStock(item.id) < item.count" class="text-[10px] font-black text-red-600">缺{{ item.count - store.getStock(item.id) }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-8">
      <div class="bg-slate-900 rounded-[40px] p-8 min-h-[500px] flex items-center justify-center relative shadow-2xl">
        <div v-if="isProcessing" class="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20 rounded-[40px]"><Loader2 class="animate-spin text-blue-500" :size="48" /></div>
        <div v-if="beadGrid.length" class="grid w-full max-w-[500px] aspect-square" :style="{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: '1px' }">
          <template v-for="(row, y) in beadGrid" :key="y">
            <div v-for="(bead, x) in row" :key="x" @click="bead.isDone = !bead.isDone" class="rounded-full border border-black/10" :style="{ backgroundColor: bead.hex, opacity: bead.isDone ? 0.2 : 1 }"></div>
          </template>
        </div>
        <div v-else class="text-slate-600 flex flex-col items-center gap-4"><Sparkles :size="48" /><p>上传图片生成图纸</p></div>
      </div>
    </div>
  </div>
</template>