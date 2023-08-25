<script setup lang="ts">
import GameService from "../services/game.ts";
import {routerPush} from "../router.ts";

async function createGame() {
  const game = await GameService.createGame()
  await routerPush('play', { gameId: game.id })
}

</script>

<template>
  <div class="container mt-5">
    <button @click="createGame" type="submit" class="btn btn-primary">Nowa gra</button>
  </div>
</template>

<style scoped>

</style>
