<script setup lang="ts">
import {storeToRefs} from 'pinia'
import {computed} from 'vue'
import type {RouteParams} from 'vue-router'
import {AppRouteNames} from "../router.ts";
import {useUserStore} from "../store/user.ts";
import AppLink from "./AppLink.vue";
import {useI18n} from "vue-i18n";

interface NavLink {
  name: AppRouteNames
  params?: Partial<RouteParams>
  title: string
  icon?: string
  display: 'all' | 'anonym' | 'authorized'
}

const { t } = useI18n()
const { user } = storeToRefs(useUserStore())

const username = computed(() => user.value?.username)
const displayStatus = computed(() => username.value ? 'authorized' : 'anonym')

const allNavLinks = computed<NavLink[]>(() => [
  {
    name: 'join',
    title: t('navBar.join'),
    display: 'all',
  },
  // {
  //   name: 'login',
  //   title: 'Sign in',
  //   display: 'all',
  // },
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
  <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm mb-3">
    <div class="container-fluid">
      <AppLink
          class="navbar-brand"
          name="home"
      >
        {{ t('navBar.title') }}
      </AppLink>
      <div class="navbar" id="navbarSupportedContent">
      <ul class="navbar-nav ml-auto">
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
          <div class="nav-link">
            <label><i class="bi bi-translate"></i>&nbsp;</label>
          <select v-model="$i18n.locale" class="localeDropdown">
            <option value="pl">Polski</option>
            <option value="en">English</option>
          </select>
          </div>
    </div>
  </nav>
</template>

<style scoped>
.localeDropdown {
  border-radius: 0.30rem;
}
</style>
