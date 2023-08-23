import { createApp } from 'vue'
import './scss/styles.scss'
import App from './App.vue'
import {router} from "./router.ts";
import {createPinia} from "pinia";
import ToastPlugin from 'vue-toast-notification';
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vue-toast-notification/dist/theme-bootstrap.css';

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.use(ToastPlugin);
app.mount('#app')
