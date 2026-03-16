<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBeadStore } from '../store/beadStore'
import { Search, Plus, Check, Square, CheckSquare, X, Scale } from 'lucide-vue-next'

const store = useBeadStore()

// --- 状态控制 ---
const searchQuery = ref('')
const showBatchModal = ref(false)
const batchSearchQuery = ref('')
const selectedIds = ref<string[]>([])
const batchValue = ref<number>(1000)
const batchUnit = ref<'count' | 'weight'>('count')
const inputMode = ref<'count' | 'weight'>('count')

// --- 页面列表筛选 ---
const filteredPalette = computed(() => {
  return store.palette.filter(color =>
      color.id.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      color.name.includes(searchQuery.value)
  ).sort((a, b) => a.id.localeCompare(b.id))
})

// --- 弹窗内筛选与全选 ---
const filteredInModal = computed(() => {
  return store.palette.filter(color =>
      color.id.toLowerCase().includes(batchSearchQuery.value.toLowerCase()) ||
      color.name.includes(batchSearchQuery.value)
  )
})

const isAllSelected = computed(() => {
  return filteredInModal.value.length > 0 &&
      filteredInModal.value.every(c => selectedIds.value.includes(c.id))
})

const toggleSelectAll = () => {
  const currentIds = filteredInModal.value.map(c => c.id)
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !currentIds.includes(id))
  } else {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...currentIds]))
  }
}

const toggleSelect = (id: string) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) selectedIds.value.splice(index, 1)
  else selectedIds.value.push(id)
}

const applyBatchUpdate = () => {
  selectedIds.value.forEach(id => {
    batchUnit.value === 'count'
        ? store.updateStock(id, batchValue.value)
        : store.updateStockByWeight(id, batchValue.value)
  })
  showBatchModal.value = false
  selectedIds.value = []
}
</script>

<template>
  <div class="space-y-6">
    <!-- 操作栏 -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
      <div class="relative w-full md:w-96">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
        <input v-model="searchQuery" type="text" placeholder="搜索色号..." class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold" />
      </div>
      <div class="flex gap-2 w-full md:w-auto">
        <button @click="inputMode = inputMode === 'count' ? 'weight' : 'count'" class="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 rounded-2xl font-bold text-slate-600 cursor-pointer">
          <Scale :size="18" /> {{ inputMode === 'count' ? '按颗录入' : '按克录入' }}
        </button>
        <button @click="showBatchModal = true" class="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 cursor-pointer">
          <Plus :size="18" /> 批量录入
        </button>
      </div>
    </div>

    <!-- 库存列表 -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="color in filteredPalette" :key="color.id" class="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div :style="{ backgroundColor: color.hex }" class="w-12 h-12 rounded-2xl shadow-inner border border-black/5 flex items-center justify-center text-[10px] font-black text-white">
            {{ color.id }}
          </div>
          <div>
            <div class="text-[10px] font-black text-blue-600 uppercase">{{ color.id }}</div>
            <div class="font-bold text-slate-800">{{ color.name }}</div>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1">
          <div class="flex items-center gap-2">
            <input type="number" :value="inputMode === 'count' ? store.getStock(color.id) : (store.getStock(color.id)/250).toFixed(1)"
                   @input="(e) => {
                const v = parseFloat((e.target as HTMLInputElement).value) || 0;
                inputMode === 'count' ? store.updateStock(color.id, v) : store.updateStockByWeight(color.id, v)
              }"
                   class="w-20 px-2 py-1 bg-slate-50 rounded-lg text-right font-bold text-blue-600 border-none focus:ring-1 focus:ring-blue-400" />
            <span class="text-xs font-bold text-slate-400">{{ inputMode === 'count' ? '颗' : '克' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量录入弹窗 -->
    <div v-if="showBatchModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-4xl h-[80vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden">
        <div class="p-8 border-b flex justify-between items-center">
          <h3 class="text-2xl font-black">批量库存补货</h3>
          <button @click="showBatchModal = false"><X :size="24" /></button>
        </div>
        <div class="p-8 bg-slate-50 flex-1 overflow-y-auto">
          <div class="flex gap-4 mb-6">
            <input v-model="batchSearchQuery" type="text" placeholder="筛选色号..." class="flex-1 px-4 py-3 rounded-2xl border-none shadow-sm font-bold" />
            <button @click="toggleSelectAll" class="px-6 py-3 rounded-2xl font-bold" :class="isAllSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'">
              {{ isAllSelected ? '取消全选' : '全选当前' }}
            </button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <div v-for="color in filteredInModal" :key="color.id" @click="toggleSelect(color.id)"
                 :class="selectedIds.includes(color.id) ? 'border-blue-500 bg-blue-50' : 'bg-white border-transparent'"
                 class="p-4 rounded-2xl border-2 transition-all cursor-pointer text-center relative">
              <div v-if="selectedIds.includes(color.id)" class="absolute top-1 right-1 bg-blue-600 text-white rounded-full p-0.5"><Check :size="10" /></div>
              <div :style="{ backgroundColor: color.hex }" class="w-10 h-10 rounded-lg mx-auto mb-2 shadow-inner border border-black/5"></div>
              <div class="text-[10px] font-bold">{{ color.id }}</div>
            </div>
          </div>
        </div>
        <div class="p-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-4">
            <span class="text-sm font-bold">已选 {{ selectedIds.length }} 个</span>
            <input v-model.number="batchValue" type="number" class="w-24 px-4 py-2 bg-slate-100 rounded-xl font-bold text-center" />
            <button @click="batchUnit = batchUnit === 'count' ? 'weight' : 'count'" class="text-xs font-bold bg-slate-100 px-3 py-2 rounded-xl">
              {{ batchUnit === 'count' ? '颗' : '克' }}
            </button>
          </div>
          <button @click="applyBatchUpdate" :disabled="selectedIds.length === 0" class="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold disabled:opacity-30">应用更新</button>
        </div>
      </div>
    </div>
  </div>
</template>