<script setup lang="ts">

import GameService, {Game} from "../services/game.ts";
import {routerPush} from "../router.ts";
import {computed, ref} from "vue";
import {useRoute} from "vue-router";
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()
const gameId = computed<string>(() => route.params.gameId as string)
const game = ref<Game>(newGame())

fetchGame(gameId.value)

async function fetchGame(id: string) {
  // loading.value = true
  try {
    game.value = await GameService.getGame(id, locale.value) as Game
  } catch (error) {
    console.error('Failed to fetch game', error)
    await routerPush('notFound')
  } finally {
    // loading.value = false
  }
}

function newGame(): Game {
  return {
    id: gameId.value,
    status: '',
    players: []
  }
}

async function kickPlayerOut(playerId: string) {
  await GameService.kickPlayerOut(gameId.value, playerId)
  await fetchGame(gameId.value)
}

</script>

<template>
  <div class="container">
    <div class="row">
      <aside class="col-md-4 mb-3">
        <div class="card text-center">
          <div class="card-header">Gracze</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="player in game.players" class="list-group-item row">
                <i v-if="player.isActive" class="bi bi-star-fill"></i>
                <i v-if="player.didBet" class="bi bi-coin"></i>
                <span class="fw-normal col">
                  &nbsp;{{ player.name }} {{ player.points }}
                </span>
                <i @click="kickPlayerOut(player.id)" class="bi bi-trash3-fill bi-btn"></i>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.bi-btn:hover {
  cursor: pointer;
}
</style>
