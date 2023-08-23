import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import * as path from "path"
import {fileURLToPath, URL} from "url";

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            src: fileURLToPath(new URL('./src', import.meta.url)),
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        }
    },
    plugins: [vue()]
})
