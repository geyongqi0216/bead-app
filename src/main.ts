import { createApp } from 'vue'
import { createPinia } from 'pinia' // 确保导入了
import './style.css'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia() // 创建实例

app.use(pinia) // 必须在 mount 之前 use
app.mount('#app')