<script setup lang="ts">
import {storeToRefs} from 'pinia'
import {computed} from 'vue'
import type {RouteParams} from 'vue-router'
import {AppRouteNames} from "../router.ts";
import {useUserStore} from "../store/user.ts";
import AppLink from "./AppLink.vue";

interface NavLink {
  name: AppRouteNames
  params?: Partial<RouteParams>
  title: string
  icon?: string
  display: 'all' | 'anonym' | 'authorized'
}

const {user} = storeToRefs(useUserStore())

const username = computed(() => user.value?.username)
const displayStatus = computed(() => username.value ? 'authorized' : 'anonym')

const allNavLinks = computed<NavLink[]>(() => [
  {
    name: 'join',
    title: 'Dołącz',
    display: 'all',
  },
  {
    name: 'login',
    title: 'Sign in',
    display: 'anonym',
  },
  {
    name: 'admin',
    title: 'Admin',
    display: 'authorized',
  },
])

const navLinks = computed(() => allNavLinks.value.filter(
    l => l.display === displayStatus.value || l.display === 'all',
))

</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <AppLink
          class="navbar-brand"
          name="home"
      >
        Home
      </AppLink>

      <ul class="nav navbar-nav pull-xs-right">
        <li
            v-for="link in navLinks"
            :key="link.name"
            class="nav-item"
        >
          <AppLink
              class="nav-link"
              active-class="active"
              :name="link.name"
              :params="link.params"
          >
            <i
                v-if="link.icon"
                :class="link.icon"
            />
            {{ link.title }}
          </AppLink>
        </li>
      </ul>
    </div>
  </nav>
</template>


