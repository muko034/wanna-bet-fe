<script setup lang="ts">
import GameService, {Games} from "../services/game.ts";
import {ref} from "vue";
import TimeAgo from 'javascript-time-ago'
import pl from 'javascript-time-ago/locale/pl'
import AppLink from "../components/AppLink.vue";
import {useI18n} from "vue-i18n";

const { locale } = useI18n()
const games = ref<Games>({
  content: [],
  hasMore: false
})
GameService.getGames(locale.value).then(res => {
  games.value = res as Games
})

TimeAgo.addDefaultLocale(pl)

const timeAgo = new TimeAgo('pl-PL')

function formatTime(date: string) {
  return timeAgo.format(Date.parse(date))
}

</script>

<template>
  <div class="container">
    <ul class="list-group">
      <li
          v-for="game in games.content"
          class="list-group-item">
        <AppLink
            class="nav-link"
            active-class="active"
            name="play"
            :params="{gameId: game.id}">
          <strong>{{ game.id }}</strong> {{ formatTime(game.createdAt) }}
        </AppLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>

</style>
