<!--库存管理组件-->
<script setup lang="ts">
import { useBeadStore } from '../store/beadStore'
const store = useBeadStore()
</script>

<template>
  <div class="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
    <h2 class="text-xl font-black mb-6 flex items-center gap-2">📦 MARD 库存清单</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="color in store.palette" :key="color.id"
           class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
        <div class="flex items-center gap-3">
          <div :style="{ backgroundColor: color.hex }" class="w-10 h-10 rounded-xl shadow-inner border border-black/5" />
          <div class="flex flex-col">
            <span class="text-xs font-bold text-blue-600">{{ color.id }}</span>
            <span class="text-sm font-bold text-slate-700">{{ color.name }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <input
              type="number"
              :value="store.getStock(color.id)"
              @input="(e) => store.updateStock(color.id, parseInt((e.target as HTMLInputElement).value) || 0)"
              class="w-20 px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-blue-500"
          />
          <span class="text-xs text-slate-400 font-bold text-nowrap">颗</span>
        </div>
      </div>
    </div>
  </div>
</template>