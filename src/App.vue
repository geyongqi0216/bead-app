<script setup lang="ts">
import { ref } from 'vue'
import BeadConverter from './components/BeadConverter.vue'
import InventoryManager from './components/InventoryManager.vue'

const activeTab = ref('converter')
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
    <div class="max-w-7xl mx-auto">
      <nav class="flex gap-3 mb-8">
        <button @click="activeTab = 'converter'" :class="activeTab === 'converter' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'" class="px-6 py-3 rounded-2xl font-bold shadow-sm transition-all cursor-pointer">图片转图纸</button>
        <button @click="activeTab = 'inventory'" :class="activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'" class="px-6 py-3 rounded-2xl font-bold shadow-sm transition-all cursor-pointer">库存管理</button>
      </nav>
      <div v-if="activeTab === 'converter'"><BeadConverter /></div>
      <div v-else-if="activeTab === 'inventory'"><InventoryManager /></div>
    </div>
  </div>
</template>