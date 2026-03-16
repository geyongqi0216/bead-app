<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth, SignInButton, UserButton } from '@clerk/vue'
import { useBeadStore } from './store/beadStore'

// 引入子组件
import BeadConverter from './components/BeadConverter.vue'
import InventoryManager from './components/InventoryManager.vue'

// 1. 状态管理
const activeTab = ref<'converter' | 'inventory'>('converter')
const store = useBeadStore()
const { isSignedIn, isLoaded } = useAuth()

/**
 * 2. 自动同步逻辑
 * 当 Clerk 确认用户已登录时，自动从后端拉取库存数据
 */
watch([isLoaded, isSignedIn], ([loaded, signed]) => {
  if (loaded && signed) {
    console.log("用户已登录，执行云端同步...");
    store.fetchInitialData()
  }
}, { immediate: true })

</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">

    <!-- [第一部分] 顶部粘性导航栏 -->
    <header class="w-full bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div class="max-w-[1600px] mx-auto px-4 h-16 flex justify-between items-center">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            M
          </div>
          <span class="font-black text-xl tracking-tighter">MARD <span class="text-blue-600">PRO</span></span>
        </div>

        <!-- 登录状态控制 -->
        <div class="flex items-center gap-4">
          <div v-if="!isLoaded" class="w-8 h-8 bg-slate-100 animate-pulse rounded-full"></div>

          <template v-else-if="!isSignedIn">
            <SignInButton mode="modal">
              <button class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/20">
                登录同步
              </button>
            </SignInButton>
          </template>

          <div v-else class="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-100">
            <span class="text-xs font-bold text-slate-500 hidden sm:inline">
              {{ store.syncStatus === 'saving' ? '同步中...' : '云端同步中' }}
            </span>
            <UserButton />
          </div>
        </div>
      </div>
    </header>

    <!-- [第二部分] 主体容器 -->
    <div class="max-w-[1600px] mx-auto px-4 mt-8">

      <!-- [重要！补回缺失的选项卡切换] -->
      <div class="flex justify-center mb-10 no-print">
        <nav class="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-slate-100">
          <button
              @click="activeTab = 'converter'"
              :class="activeTab === 'converter' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'"
              class="px-8 py-3 rounded-[20px] font-black transition-all cursor-pointer text-sm flex items-center gap-2"
          >
            🖼️ 图片转图纸
          </button>
          <button
              @click="activeTab = 'inventory'"
              :class="activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-slate-50'"
              class="px-8 py-3 rounded-[20px] font-black transition-all cursor-pointer text-sm flex items-center gap-2"
          >
            📦 库存管理中心
          </button>
        </nav>
      </div>

      <!-- [第三部分] 动态内容渲染 -->
      <main class="animate-in fade-in slide-in-from-bottom-4 duration-500">

        <!-- 情况 A: 访问库存但未登录 -->
        <div v-if="!isSignedIn && activeTab === 'inventory'" class="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-sm">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6">🔐</div>
          <h2 class="text-2xl font-black text-slate-800">库存功能需要登录</h2>
          <p class="text-slate-400 mt-2 mb-8 text-center max-w-sm px-6">
            登录后我们将会为您在云端数据库中同步您的 MARD 221色库存数据。
          </p>
          <SignInButton mode="modal">
            <button class="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black cursor-pointer hover:scale-105 transition-transform">
              立即登录
            </button>
          </SignInButton>
        </div>

        <!-- 情况 B: 已登录或正在访问转换器 -->
        <div v-else>
          <transition name="fade" mode="out-in">
            <div :key="activeTab">
              <BeadConverter v-if="activeTab === 'converter'" />
              <InventoryManager v-else-if="activeTab === 'inventory'" />
            </div>
          </transition>
        </div>
      </main>
    </div>

    <!-- [第四部分] 页脚 -->
    <footer class="mt-20 text-center no-print pb-10">
      <p class="text-xs font-bold text-slate-300 uppercase tracking-widest">
        MARD Pro Bead Assistant &copy; 2024
      </p>
    </footer>

  </div>
</template>

<style>
/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 打印模式优化 */
@media print {
  .no-print {
    display: none !important;
  }
  body {
    background-color: white !important;
  }
}

/* 自定义全局滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
::-webkit-scrollbar-track {
  background: transparent;
}
</style>