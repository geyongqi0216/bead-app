<script setup lang="ts">
import { ref } from 'vue'
import BeadConverter from './components/BeadConverter.vue'
import InventoryManager from './components/InventoryManager.vue'

// 确保这里有初始值 'converter'
const activeTab = ref('converter')
</script>

<template>
  <!-- 增加一个最外层 div，并给一个背景色方便调试 -->
  <div class="min-h-screen bg-slate-100 p-8">
    <nav class="flex gap-4 mb-8">
      <button @click="activeTab = 'converter'" :class="activeTab === 'converter' ? 'bg-blue-600 text-white' : 'bg-white'" class="px-4 py-2 rounded-xl shadow">
        图片转图纸
      </button>
      <button @click="activeTab = 'inventory'" :class="activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'bg-white'" class="px-4 py-2 rounded-xl shadow">
        库存管理
      </button>
    </nav>

    <!-- 确保 v-if 逻辑正确 -->
    <div v-if="activeTab === 'converter'">
      <BeadConverter />
    </div>
    <div v-else-if="activeTab === 'inventory'">
      <InventoryManager />
    </div>
  </div>
</template>