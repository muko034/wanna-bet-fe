<script setup lang="ts">
import GameService from "../services/game.ts";
import {routerPush} from "../router.ts";
import { useI18n } from 'vue-i18n'

const { t } = useI18n({
  // legacy: false, // you must set `false`, to use Composition API
  // locale: 'en',
  // fallbackLocale: 'en',
  // messages: {
  //   en: en,
  //   pl: pl
  // }
})
async function createGame() {
  const game = await GameService.createGame()
  await routerPush('play', {gameId: game.id})
}

</script>

<template>
  <div class="container mt-5">
    <div class="row d-flex justify-content-center">
      <div class="col text-center">
        <button @click="createGame" type="submit" class="btn btn-primary">{{ $t('home.newGame')}}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
