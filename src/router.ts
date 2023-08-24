import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteParams, RouteRecordRaw } from 'vue-router'
import Home from './views/Home.vue'
import Join from "./views/Join.vue";
import Admin from "./views/Admin.vue";
import NotFound from "./views/NotFound.vue";
import {isAuthorized} from "./store/user.ts";
import Login from "./views/SignIn.vue";
import Play from "./views/Play.vue";

export type AppRouteNames =
  | 'home'
  | 'join'
  | 'admin'
  | 'play'
  | 'login'
  | 'notFound'

export const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/',
    component: Home,
  },
  {
    name: 'join',
    path: '/join',
    component: Join,
  },
  {
    name: 'admin',
    path: '/admin',
    component: Admin,
  },
  {
    name: 'play',
    path: '/play/:gameId',
    component: Play,
  },
  {
    name: 'login',
    path: '/login',
    component: () => Login,
    beforeEnter: () => !isAuthorized(),
  },
  {
    name: 'notFound',
    path: '/404',
    component: NotFound,
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound,
  },
]
export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export function routerPush (name: AppRouteNames, params?: RouteParams): ReturnType<typeof router.push> {
  return params !== undefined
    ? router.push({
      name,
      params,
    })
    : router.push({ name })
}
