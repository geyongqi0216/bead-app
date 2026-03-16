<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Search, Plus, Check, Square, CheckSquare, X, Scale } from 'lucide-vue-next'

const store = useBeadStore()

// --- 状态 ---
const searchQuery = ref('')
const activeLetter = ref('全部')
const showBatchModal = ref(false)
const inputMode = ref<'count' | 'weight'>('count')
const selectedIds = ref<string[]>([])
const batchValue = ref(1000)
const batchUnit = ref<'count' | 'weight'>('count')

const letters = ['全部', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'M']

// --- 排序与筛选逻辑 ---
const filteredPalette = computed(() => {
  return store.palette.filter(color => {
    const matchesSearch = color.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        color.name.includes(searchQuery.value)
    const matchesLetter = activeLetter.value === '全部' || color.id.startsWith(activeLetter.value)
    return matchesSearch && matchesLetter
  }).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
})

// --- 批量处理 ---
const applyBatch = () => {
  selectedIds.value.forEach(id => {
    batchUnit.value === 'count' ? store.updateStock(id, batchValue.value) : store.updateStockByWeight(id, batchValue.value)
  })
  showBatchModal.value = false; selectedIds.value = []
}
</script>

<template>
  <div class="space-y-6">
    <!-- 字母筛选导航 -->
    <div class="flex flex-wrap gap-2 p-3 bg-white rounded-3xl shadow-sm border border-slate-100">
      <button v-for="l in letters" :key="l" @click="activeLetter = l"
              :class="activeLetter === l ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
              class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer">
        {{ l }}
      </button>
    </div>

    <!-- 搜索与操作 -->
    <div class="flex flex-col md:flex-row gap-4 justify-between bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
        <input v-model="searchQuery" type="text" placeholder="搜索 MARD 色号..." class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl font-bold" />
      </div>
      <div class="flex gap-2">
        <button @click="inputMode = inputMode === 'count' ? 'weight' : 'count'" class="px-6 py-3 bg-slate-100 rounded-2xl font-bold text-slate-600 flex items-center gap-2 cursor-pointer">
          <Scale :size="18" /> 按{{ inputMode === 'count' ? '颗' : '克' }}
        </button>
        <button @click="showBatchModal = true" class="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center gap-2 cursor-pointer">
          <Plus :size="18" /> 批量入库
        </button>
      </div>
    </div>

    <!-- 221色紧凑网格 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      <div v-for="color in filteredPalette" :key="color.id" class="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
        <div :style="{ backgroundColor: color.hex }" class="w-full aspect-square rounded-xl mb-2 shadow-inner border border-black/5" />
        <div class="text-[10px] font-black text-blue-600">{{ color.id }}</div>
        <div class="flex items-center gap-1 mt-1">
          <input type="number" :value="inputMode === 'count' ? store.getStock(color.id) : (store.getStock(color.id)/100).toFixed(1)"
                 @input="(e) => {
              const v = parseFloat((e.target as HTMLInputElement).value) || 0;
              inputMode === 'count' ? store.updateStock(color.id, v) : store.updateStockByWeight(color.id, v)
            }"
                 class="w-12 text-center bg-slate-50 rounded-lg text-[10px] font-bold py-1 border-none" />
          <span class="text-[8px] text-slate-400 font-bold">{{ inputMode === 'count' ? '颗' : 'g' }}</span>
        </div>
      </div>
    </div>

    <!-- 批量弹窗 (全选逻辑参考之前) -->
    <div v-if="showBatchModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-4xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
        <div class="p-8 border-b flex justify-between items-center"><h3 class="text-2xl font-black">批量操作 MARD 色库</h3><button @click="showBatchModal = false"><X :size="24" /></button></div>
        <div class="flex-1 overflow-y-auto p-8 bg-slate-50">
          <!-- 批量勾选网格... (逻辑同前) -->
        </div>
        <div class="p-8 border-t flex justify-between items-center bg-white">
          <div class="flex items-center gap-4"><span class="text-sm font-bold">已选 {{ selectedIds.length }} 个</span><input v-model.number="batchValue" type="number" class="w-24 px-4 py-2 bg-slate-100 rounded-xl font-bold text-center" /></div>
          <button @click="applyBatch" :disabled="selectedIds.length === 0" class="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg disabled:opacity-30">立即应用</button>
        </div>
      </div>
    </div>
  </div>
</template>