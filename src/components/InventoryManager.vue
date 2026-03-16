<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Search, Plus, Check, Square, CheckSquare, X, Scale, CloudCheck, CloudUpload, AlertCircle } from 'lucide-vue-next'

const store = useBeadStore()

// 状态控制
const searchQuery = ref('')
const activeLetter = ref('全部')
const showBatchModal = ref(false)
const inputMode = ref<'count' | 'weight'>('count')
const letters = ['全部', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'M']

// 批量操作相关的状态
const batchSearchQuery = ref('')
const selectedIds = ref<string[]>([])
const batchValue = ref<number>(1000)
const batchUnit = ref<'count' | 'weight'>('count')

// 初始化数据
onMounted(() => {
  store.fetchInitialData()
})

const filteredPalette = computed(() => {
  return store.palette.filter(color =>
      color.id.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
      (activeLetter.value === '全部' || color.id.startsWith(activeLetter.value))
  ).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
})

const filteredInModal = computed(() => {
  return store.palette.filter(color =>
      color.id.toLowerCase().includes(batchSearchQuery.value.toLowerCase())
  ).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
})

const isAllSelected = computed(() => {
  return filteredInModal.value.length > 0 &&
      filteredInModal.value.every(c => selectedIds.value.includes(c.id))
})

const toggleSelectAll = () => {
  const currentIds = filteredInModal.value.map(c => c.id)
  selectedIds.value = isAllSelected.value
      ? selectedIds.value.filter(id => !currentIds.includes(id))
      : Array.from(new Set([...selectedIds.value, ...currentIds]))
}

const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) selectedIds.value.splice(index, 1)
  else selectedIds.value.push(id)
}

const applyBatchUpdate = () => {
  selectedIds.value.forEach(id => {
    batchUnit.value === 'count' ? store.updateStock(id, batchValue.value) : store.updateStockByWeight(id, batchValue.value)
  })
  showBatchModal.value = false; selectedIds.value = []
}
</script>

<template>
  <div class="space-y-6 pb-24">
    <!-- 顶部状态与字母筛选 -->
    <div class="flex flex-wrap gap-2 items-center justify-between no-print">
      <div class="flex flex-wrap gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex-1">
        <button v-for="l in letters" :key="l" @click="activeLetter = l"
                :class="activeLetter === l ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'"
                class="px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer">
          {{ l }}
        </button>
      </div>

      <!-- 自动保存状态指示器 -->
      <div class="px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-xs shadow-sm bg-white border border-slate-100">
        <div v-if="store.syncStatus === 'saving'" class="flex items-center gap-2 text-amber-500">
          <CloudUpload :size="16" class="animate-bounce" /> 保存中...
        </div>
        <div v-else-if="store.syncStatus === 'error'" class="flex items-center gap-2 text-red-500">
          <AlertCircle :size="16" /> 同步失败
        </div>
        <div v-else class="flex items-center gap-2 text-green-500">
          <CloudCheck :size="16" /> 云端已同步
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
      <div class="relative w-full md:w-96">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
        <input v-model="searchQuery" type="text" placeholder="快速寻找色号..." class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" />
      </div>
      <div class="flex gap-2 w-full md:w-auto">
        <button @click="inputMode = inputMode === 'count' ? 'weight' : 'count'" class="flex-1 px-6 py-3 bg-slate-100 rounded-2xl font-bold text-slate-600 flex items-center justify-center gap-2 cursor-pointer">
          <Scale :size="18" /> 按{{ inputMode === 'count' ? '颗' : '克' }}
        </button>
        <button @click="showBatchModal = true" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer">
          <Plus :size="18" /> 批量入库
        </button>
      </div>
    </div>

    <!-- 库存网格 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      <div v-for="color in filteredPalette" :key="color.id" class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
        <div :style="{ backgroundColor: color.hex }" class="w-full aspect-square rounded-xl mb-2 shadow-inner border border-black/5" />
        <div class="text-[10px] font-black text-blue-600">{{ color.id }}</div>
        <div class="mt-2 flex items-center gap-1">
          <input type="number" :value="inputMode === 'count' ? store.getStock(color.id) : (store.getStock(color.id)/100).toFixed(1)"
                 @input="(e: any) => {
              const v = parseFloat(e.target.value) || 0
              inputMode === 'count' ? store.updateStock(color.id, v) : store.updateStockByWeight(color.id, v)
            }"
                 class="w-12 text-center bg-slate-50 rounded-lg text-[10px] font-bold py-1 border-none focus:ring-1 focus:ring-blue-400" />
          <span class="text-[8px] text-slate-400 font-bold uppercase">{{ inputMode === 'count' ? '颗' : 'g' }}</span>
        </div>
      </div>
    </div>

    <!-- 批量录入 Modal -->
    <div v-if="showBatchModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-5xl h-[85vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
        <div class="p-6 border-b flex justify-between items-center bg-white">
          <h3 class="text-xl font-black">批量库存补货</h3>
          <button @click="showBatchModal = false" class="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"><X :size="20" /></button>
        </div>
        <div class="p-6 bg-slate-50 flex-1 overflow-hidden flex flex-col gap-4">
          <div class="flex gap-4">
            <input v-model="batchSearchQuery" type="text" placeholder="筛选..." class="flex-1 px-4 py-3 rounded-xl border-none shadow-sm font-bold" />
            <button @click="toggleSelectAll" class="px-6 py-3 rounded-xl font-bold transition-all shadow-sm" :class="isAllSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'">
              {{ isAllSelected ? '全不选' : '全选' }}
            </button>
          </div>
          <div class="flex-1 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 pr-2 custom-scrollbar">
            <div v-for="color in filteredInModal" :key="color.id" @click="toggleSelect(color.id)"
                 :class="selectedIds.includes(color.id) ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'bg-white border-transparent'"
                 class="p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center relative">
              <div v-if="selectedIds.includes(color.id)" class="absolute top-0.5 right-0.5 bg-blue-600 text-white rounded-full p-0.5"><Check :size="8" stroke-width="4" /></div>
              <div :style="{ backgroundColor: color.hex }" class="w-8 h-8 rounded-lg mb-1 shadow-inner border border-black/5"></div>
              <div class="text-[9px] font-black text-slate-700 uppercase">{{ color.id }}</div>
            </div>
          </div>
        </div>
        <div class="p-6 border-t bg-white flex justify-between items-center">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-slate-400">已选 {{ selectedIds.length }} 个</span>
            <div class="flex items-center bg-slate-100 rounded-xl p-1">
              <input v-model.number="batchValue" type="number" class="w-20 px-2 py-1 bg-transparent font-bold text-center border-none focus:ring-0" />
              <button @click="batchUnit = batchUnit === 'count' ? 'weight' : 'count'" class="px-3 py-1 bg-white rounded-lg text-xs font-bold shadow-sm">{{ batchUnit === 'count' ? '颗' : '克' }}</button>
            </div>
          </div>
          <button @click="applyBatchUpdate" :disabled="selectedIds.length === 0" class="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-30 cursor-pointer">立即应用并同步</button>
        </div>
      </div>
    </div>
  </div>
</template>