<script setup lang="ts">
import {onBeforeRouteUpdate, useRoute} from "vue-router";
import {computed, onMounted, onUnmounted, ref, watch} from "vue";
import GameService, {Bet, Game, Player, Task, TaskResult} from "../services/game.ts";
import {v4 as uuidv4} from 'uuid';
import {ToastProps, useToast} from "vue-toast-notification";
import {routerPush} from "../router.ts";
import axios from "axios";
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const route = useRoute()
const gameId = computed<string>(() => route.params.gameId as string)
const game = ref<Game>(newGame())
const state = computed<string>(() => {
  if (!didCurrentPlayerJoined.value) {
    return 'ENTERED'
  }
  if (game.value.status === 'CREATED') {
    return 'JOINED'
  }
  return game.value.status
})
const playerName = ref('')
const task = computed<Task>(() => game.value.task ?? newTask())
const playerId = computed<string>(() => {
  const playerId: string | null = localStorage.getItem(`playerId-${gameId.value}`)
  if (playerId) {
    return playerId
  } else {
    const newId = uuidv4()
    localStorage.setItem(`playerId-${gameId.value}`, newId)
    return newId
  }
})
const currentPlayer = computed<Player>(() => game.value.players.find((it) => it.id === playerId.value) ?? {
  id: playerId.value,
  name: playerName.value,
  points: 0,
  didBet: false,
  isActive: false
})
const bet = ref<Bet>(newBet())
const didCurrentPlayerJoined = computed<boolean>(() => game.value.players.findIndex((it) => it.id === playerId.value) >= 0)
const taskCompletion = ref<TaskResult>(TaskResult.UNDEFINED)
var polling: NodeJS.Timeout

watch(state, async (newValue, _) => {
  if (newValue !== 'TASK_EXECUTING' && newValue !== 'LOADING') {
    taskCompletion.value = TaskResult.UNDEFINED
  }
})

watch(locale, async () => {
  await fetchGame(gameId.value)
})

async function init() {
  await fetchGame(gameId.value)
  bet.value = newBet()
  playerName.value = ''
  if (gameId.value) {
    polling = setInterval(() => fetchGame(gameId.value), 5000); // poll Game every 5 seconds
  }
}

function newGame(): Game {
  return {
    id: gameId.value,
    status: '',
    players: []
  }
}

function newTask(): Task {
  return {
    id: 0,
    type: '',
    content: '',
    timeLimit: 'NONE'
  }
}

function newBet(): Bet {
  return {
    amount: 1
  }
}

const $toast = useToast();
const toastProps: ToastProps = {
  position: 'top-right',
  duration: 3000
}

function toastError(message: string) {
  $toast.error(message, toastProps)
}

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

async function joinGame() {
  try {
    game.value = await GameService.joinGame(gameId.value, playerName.value, playerId.value, locale.value) as Game
  } catch (error) {
    handleApiError(error)
  }
}

async function startGame() {
  try {
    game.value = await GameService.startGame(gameId.value, locale.value) as Game
  } catch (error) {
    handleApiError(error)
  }
}

async function betTask() {
  try {
    game.value = await GameService.betTask(gameId.value, playerId.value, bet.value.amount, bet.value.result!, locale.value) as Game
  } catch (error) {
    handleApiError(error)
  }
}

async function successTask() {
  try {
    game.value = await GameService.completeTask(gameId.value, playerId.value, 'YES', locale.value) as Game
  } catch (error){
    handleApiError(error)
  }
  taskCompletion.value = TaskResult.YES
  bet.value = newBet()
}

async function failTask() {
  try {
    game.value = await GameService.completeTask(gameId.value, playerId.value, 'NO', locale.value) as Game
  } catch (error) {
    handleApiError(error)
  }
  taskCompletion.value = TaskResult.NO
  bet.value = newBet()
}

async function redrawTask() {
  try {
    game.value = await GameService.drawTask(gameId.value, locale.value) as Game
  } catch (error) {
    handleApiError(error)
  }
}

watch(
    () => route.params.gameId,
    (newId, _) => {
      console.log(`From watch(): New gameId: ${newId}`)

      init()
    }
)

onBeforeRouteUpdate(async (to, from) => {
  if (to.params.gameId !== from.params.gameId) {
    console.log(`From onBeforeRouteUpdate(): New gameId: ${to.params.gameId}`)
    // routerPush('play', { gameId: to.params.gameId })
  }
})

onMounted(async () => {
  console.log(`Mounted`)
  await init()

})

onUnmounted( () => {
  if (polling) {
    clearInterval(polling)
  }
})

function goToAdmin() {
  routerPush('gameAdmin', {gameId: gameId.value})
}

function handleApiError(error: any) {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    toastError(`${error.response?.data?.message}`)
  } else {
    toastError(`${error.message}`)
  }
  console.error(error)
}
</script>

<template>
  <div class="container">
    <div class="row">
      <div class="col-md-8 mb-3">
        <div class="card text-center" style="min-height: 20rem;">
          <div class="card-header">
            <h2 v-if="state === 'ENTERED'">{{ t('play.state.entered') }}</h2>
            <h2 v-else-if="state === 'BETTING'">{{ t('play.state.betting') }}</h2>
            <h2 v-else-if="state === 'JOINED'">{{ t('play.state.joined') }}</h2>
            <h2 v-else-if="state === 'TASK_EXECUTING'">{{ t('play.state.taskExecution') }}</h2>
            <h2 v-else>[{{ gameId }}]</h2>
          </div>
          <div class="card-body">
            <div v-if="state === 'ENTERED'" id="join">
              <div class="mb-3">
                <label for="playerNameInput" class="form-label text-left">{{ t('play.playerName.label') }}</label>
                <input v-model="playerName" type="text" class="form-control" id="playerNameInput"
                       v-bind:placeholder="t('play.playerName.placeholder')">
              </div>
              <button @click="joinGame" type="submit" class="btn btn-primary">{{ t('play.join') }}</button>
            </div>
            <div v-else-if="state === 'JOINED'">
              <button
                  :disabled="game.players.length < 2"
                  @click="startGame"
                  type="submit"
                  class="btn btn-primary">
                {{ t('play.startGame') }}
              </button>
            </div>
            <div v-else-if="state === 'BETTING'" class="d-flex flex-column justify-content-center align-items-center">
              <div class="card text-center" style="max-width: 20rem; min-height: 20rem; margin-bottom: 20px">
                <div v-if="task.type == 'PHYSICAL'" class="card-header">
                  {{ t('play.physicalTask') }} <i
                    v-if="task.timeLimit !== 'NONE'"
                    :class="task.timeLimit === 'QUARTER_MINUTE'
                    ? 'bi bi-hourglass-split icon-yellow'
                    : (task.timeLimit === 'HALF_MINUTE' ? 'bi bi-hourglass-split icon-red': 'bi bi-hourglass-split')"></i>
                </div>
                <div v-else class="card-header">
                  {{ t('play.mentalTask') }} <i
                    v-if="task.timeLimit !== 'NONE'"
                    :class="task.timeLimit === 'QUARTER_MINUTE'
                    ? 'bi bi-hourglass-split icon-yellow'
                    : (task.timeLimit === 'HALF_MINUTE' ? 'bi bi-hourglass-split icon-red': 'bi bi-hourglass-split')"></i>
                </div>
                <div class="card-body">
                  <p v-if="!currentPlayer.isActive" class="card-text">{{ task.content }}</p>
                  <p v-else class="card-text">{{ t('play.waitForBet') }}</p>
                </div>
                <div>
                  <button @click="redrawTask" type="button" class="btn btn-light btn-sm">
                    <span class="bi bi-shuffle" style="color: rgb(128,128,128)"></span>
                  </button>
                </div>
              </div>
              <div v-if="!currentPlayer.isActive">
                <label for="amountInput" class="form-label">{{ t('play.betInput') }} {{ bet.amount }}</label>
                <input v-model="bet.amount" type="range" class="form-range" id="amountInput" min="1"
                       :max="Math.floor(currentPlayer.points / 2)"
                       @input="(event: Event) => {
         const inputEvent = event as InputEvent; // Assuming it's an input event
         const target = inputEvent.target as HTMLInputElement;
         bet.amount = parseInt(target?.value);
       }">
                <p>{{ t('play.willPlayerCompleteTask') }}</p>
                <div class="form-check form-check-inline">
                  <input v-model="bet.result" value="YES" class="form-check-input" type="radio"
                         name="inlineRadioOptions"
                         id="yesBetOption">
                  <label class="form-check-label" for="yesBetOption">{{ t('play.yes') }}</label>
                </div>
                <div class="form-check form-check-inline">
                  <input v-model="bet.result" value="NO" class="form-check-input" type="radio" name="inlineRadioOptions"
                         id="noBetOption">
                  <label class="form-check-label" for="noBetOption">{{ t('play.no') }}</label>
                </div>
                <button :disabled="!bet.result" @click="betTask" type="submit" class="btn btn-primary">
                  {{ currentPlayer.didBet ? t('play.changeBet') : t('play.bet') }}
                </button>
              </div>
              <div v-if="currentPlayer.isActive">
                <p>{{ t('play.waitForBet') }}</p>
              </div>
            </div>
            <div v-else-if="state === 'TASK_EXECUTING'"
                 class="d-flex flex-column justify-content-center align-items-center">
              <div class="card text-center" style="max-width: 20rem; min-height: 20rem; margin-bottom: 20px">
                <div class="card-header">{{ task.type == 'PHYSICAL' ? t('play.physicalTask') : t('play.mentalTask') }}</div>
                <div class="card-body">
                  <p v-if="!currentPlayer.isActive || task.type == 'PHYSICAL'" class="card-text">{{ task.content }}</p>
                  <p v-else class="card-text">{{ t('play.waitForBet') }}</p>
                </div>
              </div>
              <p>{{ t('play.doesPlayerCompleteTask') }}</p>
              <div class="row">
                <div class="btn-group" role="group" aria-label="Basic example">
                  <button @click="successTask" type="submit" class="btn btn-success"
                          :disabled="taskCompletion == TaskResult.YES">{{ t('play.yes') }}
                  </button>
                  <button @click="failTask" type="submit" class="btn btn-danger"
                          :disabled="taskCompletion == TaskResult.NO">{{ t('play.no') }}
                  </button>
                </div>
              </div>
              <p v-if="taskCompletion !== TaskResult.UNDEFINED" style="color: darkorange">{{ t('play.waitForTaskCompletionConfirmation') }}</p>
            </div>
            <div v-else-if="state === 'LOADING'">
              <div class="spinner-border" role="status">
                <span class="sr-only"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <aside class="col-md-4 mb-3">
        <div class="card text-center" style="margin-bottom: 1rem">
          <div class="card-header">{{ t('play.score')}}
            <div class="scores-gear"><i @click="goToAdmin" class="bi bi-gear btn btn-light btn-xs icn-light-gray"></i>
            </div>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="player in game.players" class="list-group-item">
                <i v-if="player.isActive" class="bi bi-star-fill"></i>
                <i v-if="player.didBet" class="bi bi-coin"></i>
                <span :class="player.id === currentPlayer.id ? 'fw-bold' : 'fw-normal'">
                  &nbsp;{{ player.name }} | {{ player.points }}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div class="card text-center">
          <div class="card-header">{{ t('play.legend.header') }}</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li class="list-group-item">
                <i class="bi bi-star-fill"></i><span> - {{ t('play.legend.activePlayer') }}</span>
              </li>
              <li class="list-group-item">
                <i class="bi bi-coin"></i><span> - {{ t('play.legend.bet') }}</span>
              </li>
              <li class="list-group-item">
                <span class="fw-bold">{{ t('play.legend.currentPlayer') }}</span>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.icon-red {
  color: red;
}

.icon-yellow {
  color: #ffba19;
}

.scores-gear {
  position: relative;
  float: right;
}

.btn-xs {
  --bs-btn-padding-x: 0rem;
  --bs-btn-padding-y: 0rem;
}

.icn-light-gray {
  color: #cccccc;
}
</style>
