<script setup lang="ts">
import { ref } from 'vue'
import BeadConverter from './components/BeadConverter.vue'
import InventoryManager from './components/InventoryManager.vue'

const activeTab = ref('converter')
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900 font-sans">
    <div class="max-w-[1600px] mx-auto"> <!-- 调宽最大宽度以适应 221 色网格 -->
      <header class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-black tracking-tight">MARD <span class="text-blue-600">PRO</span></h1>
        <nav class="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button @click="activeTab = 'converter'" :class="activeTab === 'converter' ? 'bg-blue-600 text-white' : 'text-slate-500'" class="px-6 py-2 rounded-xl font-bold transition-all cursor-pointer text-sm">图片转换</button>
          <button @click="activeTab = 'inventory'" :class="activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-500'" class="px-6 py-2 rounded-xl font-bold transition-all cursor-pointer text-sm">库存中心</button>
        </nav>
      </header>

      <main>
        <div v-if="activeTab === 'converter'"><BeadConverter /></div>
        <div v-else-if="activeTab === 'inventory'"><InventoryManager /></div>
      </main>
    </div>
  </div>
</template>