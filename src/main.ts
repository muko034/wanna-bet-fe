import {createApp, Plugin} from 'vue'
import './scss/styles.scss'
import App from './App.vue'
import {router} from "./router.ts";
import {createPinia} from "pinia";
import ToastPlugin from 'vue-toast-notification';
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'vue-toast-notification/dist/theme-bootstrap.css';
import axios from "axios";
import axiosRetry, {isIdempotentRequestError} from "axios-retry";
import {axiosETAGCache} from "axios-etag-cache";
import {createI18n} from "vue-i18n";
import pl from './locales/pl.json'
import en from './locales/en.json'

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

axiosETAGCache(axios);

const i18n = createI18n({
    legacy: false, // you must set `false`, to use Composition API
    locale: 'pl',
    fallbackLocale: 'en',
    messages: {
      en: en,
      pl: pl
    }
}) as Plugin

const app = createApp(App)
app.use(router)
app.use(createPinia())
app.use(ToastPlugin);
app.use(i18n)
app.mount('#app')
