import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { clerkPlugin } from '@clerk/vue' // 导入插件
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())

// 使用你的 Clerk Publishable Key
app.use(clerkPlugin, {
    publishableKey: 'pk_test_Y2VydGFpbi1waXBlZmlzaC0xNS5jbGVyay5hY2NvdW50cy5kZXYk'
})

app.mount('#app')