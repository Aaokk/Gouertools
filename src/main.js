import { createApp } from 'vue'
import App from './App.vue'
import WatermarkEditor from './components/WatermarkEditor.vue'

const app = createApp(App)
app.component('WatermarkEditor', WatermarkEditor)
app.mount('#app')
