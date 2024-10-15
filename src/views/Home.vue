<script setup lang="ts">
import GameService from "../services/game.ts";
import {routerPush} from "../router.ts";
import {useI18n} from "vue-i18n";

const { t, locale } = useI18n()
async function createGame() {
  const game = await GameService.createGame(locale.value)
  await routerPush('play', {gameId: game.id})
}

</script>

<template>
  <div class="container mt-5">
    <div class="row d-flex justify-content-center">
      <div class="col text-center">
        <button @click="createGame" type="submit" class="btn btn-primary">{{ t('home.newGame')}}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
