<script setup lang="ts">

import GameService, {Game} from "../services/game.ts";
import {routerPush} from "../router.ts";
import {computed, ref} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from 'vue-i18n'

const {t, locale} = useI18n()
const route = useRoute()
const gameId = computed<string>(() => route.params.gameId as string)
const game = ref<Game>(newGame())
const debounceTimeouts = ref<Record<string, number>>({});

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
  game.value = await GameService.kickPlayerOut(gameId.value, playerId, locale.value)
}

function onPointsInput(playerId: string, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  const newPoints = Number(target.value);

  if (debounceTimeouts.value[playerId]) {
    clearTimeout(debounceTimeouts.value[playerId]);
  }

  debounceTimeouts.value[playerId] = window.setTimeout(async () => {
    game.value = await GameService.changePlayerPoints(gameId.value, playerId, newPoints, locale.value);
  }, 500); // 500ms delay
}

function goBack() {
  routerPush('play', {gameId: gameId.value})
}

</script>

<template>
  <div class="container">
    <button class="btn btn-secondary mb-3" @click="goBack">
      <i class="bi bi-arrow-return-left me-2"></i>
      {{ t('admin.goBack') }}
    </button>
    <div class="">
      <aside class="col-md-4 mb-3">
        <div class="card text-center">
          <div class="card-header">{{ t('admin.players') }}</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="player in game.players" class="list-group-item d-flex align-items-center">
                <i v-if="player.isActive" class="bi bi-star-fill"></i>
                <i v-if="player.didBet" class="bi bi-coin"></i>
                <i v-if="!player.didBet && !player.isActive" class="bi bi-square-fill transparent"></i>
                <span class="fw-normal ms-2">
                  {{ player.name }}
                </span>
                <input
                    type="number"
                    :value="player.points"
                    @input="onPointsInput(player.id, $event)"
                    class="form-control ms-2 me-2"
                />
                <i @click="kickPlayerOut(player.id)" class="bi bi-trash3-fill bi-btn ms-auto"></i>
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

.card-body {
  text-align: left;
}

.transparent {
  opacity: 0;
}

.bi-btn.ms-auto {
  margin-left: auto;
  display: block;
}
</style>
