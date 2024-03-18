import { createApp } from 'vue'
import './scss/styles.scss'
import App from './App.vue'
import {router} from "./router.ts";
import {createPinia} from "pinia";
import ToastPlugin from 'vue-toast-notification';
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vue-toast-notification/dist/theme-bootstrap.css';
import axios from "axios";
import axiosRetry, {isIdempotentRequestError} from "axios-retry";

axiosRetry(axios, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return retryCount * 500; // time interval between retries
    },
    retryCondition: (error) => {
        // if retry condition is not specified, by default idempotent requests are retried
        return isIdempotentRequestError(error)
            || (error.response?.status === 409 && (error.response?.data as { code?: number }).code === 40901)
            || false;
    },
})

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.use(ToastPlugin);
app.mount('#app')
