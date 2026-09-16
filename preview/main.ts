import './chrome-stub'
import { createApp } from 'vue'
import App from '../src/ui/launcher/App.vue'
import '../src/ui/launcher/launcher.css'

document.documentElement.style.height = '100%'
createApp(App).mount('#app')
