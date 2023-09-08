<script setup lang="ts">
import {onBeforeRouteUpdate, useRoute} from "vue-router";
import {computed, onMounted, ref, watch} from "vue";
import GameService, {Bet, Game, Player, Task} from "../services/game.ts";
import Stomp, {Subscription} from "webstomp-client"
import {CONFIG} from "../config.ts";
import {v4 as uuidv4} from 'uuid';
import {ToastProps, useToast} from "vue-toast-notification";
import {routerPush} from "../router.ts";


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
  if (requestsWithoutReply.value.length > 0) {
    return 'LOADING'
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
const requestsWithoutReply = ref<string[]>([])
let lastEventTimestamp: number = Date.now()

async function init() {
  await fetchGame(gameId.value)
  bet.value = newBet()
  playerName.value = ''
  requestsWithoutReply.value = []

  if (!stompClient.connected) {
    connect()
  } else {
    subscriptions = subscribe()
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

function deleteFromNotRepliedRequests(requestId: string): boolean {
  const index = requestsWithoutReply.value.indexOf(requestId)
  if (index !== -1) {
    requestsWithoutReply.value.splice(index, 1)
  }
  return index !== -1
}

const stompClient = Stomp.client(CONFIG.WS_URL);
let subscriptions: Array<Subscription> = []

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
    game.value = await GameService.getGame(id) as Game
  } catch (error) {
    console.error('Failed to fetch game', error)
    await routerPush('notFound')
  } finally {
    // loading.value = false
  }
}

function joinGame() {
  const requestId = uuidv4();
  stompClient.send("/app/join-game", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value,
    playerName: playerName.value,
    playerId: playerId.value
  }))
  requestsWithoutReply.value.push(requestId)
}

function startGame() {
  const requestId = uuidv4();
  stompClient.send("/app/start-game", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value
  }))
  requestsWithoutReply.value.push(requestId)
}

function betTask() {
  const requestId = uuidv4();
  stompClient.send("/app/bet-task", JSON.stringify({
    requestId: requestId,
    playerId: playerId.value,
    amount: bet.value.amount,
    result: bet.value.result,
  }))
  requestsWithoutReply.value.push(requestId)
}

function successTask() {
  const requestId = uuidv4();
  stompClient.send("/app/complete-task", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value,
    taskResult: 'YES',
  }))
  requestsWithoutReply.value.push(requestId)
}

function failTask() {
  const requestId = uuidv4();
  stompClient.send("/app/complete-task", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value,
    taskResult: 'NO',
  }))
  requestsWithoutReply.value.push(requestId)
}

function redrawTask() {
  const requestId = uuidv4();
  stompClient.send("/app/draw-task", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value
  }))
  requestsWithoutReply.value.push(requestId)
}

function connect() {
  stompClient.connect(
      {},
      () => {
        subscriptions = subscribe()
      },
      error => {
        console.error(error);
      }
  );
}

function subscribe() {
  return [
    stompClient.subscribe(`/topic/games/${gameId.value}/events/player-joined`, msg => {
      const event = JSON.parse(msg.body)
      console.log(event)
      game.value = event.game
      deleteFromNotRepliedRequests(event.correlationId)
    }),
    stompClient.subscribe(`/topic/games/${gameId.value}/events/game-started`, msg => {
      const event = JSON.parse(msg.body)
      game.value = event.game
      deleteFromNotRepliedRequests(event.correlationId)
    }),
    stompClient.subscribe(`/topic/games/${gameId.value}/events/task-drawn`, msg => {
      const event = JSON.parse(msg.body)
      game.value = event.game
      bet.value = newBet()
      if (deleteFromNotRepliedRequests(event.correlationId)) {
        $toast.info("Zadanie zostało zminione!", toastProps)
      }
    }),
    stompClient.subscribe(`/topic/games/${gameId.value}/events/player-bet`, msg => {
      const event = JSON.parse(msg.body)
      const eventTimestamp = Date.parse(event.createdAt)
      if (eventTimestamp > lastEventTimestamp) {
        lastEventTimestamp = eventTimestamp
        game.value = event.game
      }
      deleteFromNotRepliedRequests(event.correlationId)
    }),
    stompClient.subscribe(`/topic/games/${gameId.value}/events/all-player-bet`, msg => {
      const event = JSON.parse(msg.body)
      const eventTimestamp = Date.parse(event.createdAt)
      if (eventTimestamp > lastEventTimestamp) {
        lastEventTimestamp = eventTimestamp
        game.value = event.game
      }
      deleteFromNotRepliedRequests(event.correlationId)
    }),
    stompClient.subscribe(`/topic/games/${gameId.value}/events/task-completed`, msg => {
      const event = JSON.parse(msg.body)
      game.value = event.game
      deleteFromNotRepliedRequests(event.correlationId)
    }),
    stompClient.subscribe(`/user/queue/errors`, msg => {
      const error = JSON.parse(msg.body)
      toastError(error.message)
    })
  ]
}

function unsubscribe() {
  subscriptions.forEach(sub => stompClient.unsubscribe(sub.id))
}

watch(
    () => route.params.gameId,
    (newId, _) => {
      console.log(`From watch(): New gameId: ${newId}`)
      unsubscribe()
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
  // connect()
  // refreshGame()
})
</script>

<template>
  <div class="container">
    <div class="row">
      <div class="col-md-8 mb-3">
        <div class="card text-center" style="min-height: 20rem;">
          <div class="card-header">
            <h2 v-if="state === 'ENTERED'">Dołącz do gry [{{ gameId }}]</h2>
            <h2 v-else-if="state === 'BETTING'">Obstawianie [{{ gameId }}]</h2>
            <h2 v-else-if="state === 'JOINED'">Wszyscy gotowi? [{{ gameId }}]</h2>
            <h2 v-else-if="state === 'TASK_EXECUTING'">Czas próby [{{ gameId }}]</h2>
            <h2 v-else>[{{ gameId }}]</h2>
          </div>
          <div class="card-body">
            <div v-if="state === 'ENTERED'" id="join">
              <div class="mb-3">
                <label for="playerNameInput" class="form-label text-left">Imię</label>
                <input v-model="playerName" type="text" class="form-control" id="playerNameInput"
                       placeholder="Wprowadź twoje imię">
              </div>
              <button @click="joinGame" type="submit" class="btn btn-primary">Dołącz</button>
            </div>
            <div v-else-if="state === 'JOINED'">
              <button
                  :disabled="game.players.length < 2"
                  @click="startGame"
                  type="submit"
                  class="btn btn-primary">
                Rozpocznij grę
              </button>
            </div>
            <div v-else-if="state === 'BETTING'" class="d-flex flex-column justify-content-center align-items-center">
              <div class="card text-center" style="max-width: 20rem; min-height: 20rem; margin-bottom: 20px">
                <div v-if="task.type == 'PHYSICAL'" class="card-header">
                  Zadanie zręcznościowe <i
                    v-if="task.timeLimit !== 'NONE'"
                    :class="task.timeLimit === 'QUARTER_MINUTE'
                    ? 'bi bi-hourglass-split icon-yellow'
                    : (task.timeLimit === 'HALF_MINUTE' ? 'bi bi-hourglass-split icon-red': 'bi bi-hourglass-split')"></i>
                </div>
                <div v-else class="card-header">
                  Zadanie umysłowe <i
                    v-if="task.timeLimit !== 'NONE'"
                    :class="task.timeLimit === 'QUARTER_MINUTE'
                    ? 'bi bi-hourglass-split icon-yellow'
                    : (task.timeLimit === 'HALF_MINUTE' ? 'bi bi-hourglass-split icon-red': 'bi bi-hourglass-split')"></i>
                </div>
                <div class="card-body">
                  <p v-if="!currentPlayer.isActive" class="card-text">{{ task.content }}</p>
                  <p v-else class="card-text">Poczekaj aż inni gracze skończą obstawiać</p>
                </div>
                <div>
                  <button @click="redrawTask" type="button" class="btn btn-light btn-sm">
                    <span class="bi bi-shuffle" style="color: gray"></span>
                  </button>
                </div>
              </div>
              <div v-if="!currentPlayer.isActive">
                <label for="amountInput" class="form-label">Ile obstawiasz? {{ bet.amount }}</label>
                <input v-model="bet.amount" type="range" class="form-range" id="amountInput" min="1"
                       :max="Math.floor(currentPlayer.points / 2)">
                <p>Czy gracz wykona zadanie?</p>
                <div class="form-check form-check-inline">
                  <input v-model="bet.result" value="YES" class="form-check-input" type="radio"
                         name="inlineRadioOptions"
                         id="yesBetOption">
                  <label class="form-check-label" for="yesBetOption">Tak</label>
                </div>
                <div class="form-check form-check-inline">
                  <input v-model="bet.result" value="NO" class="form-check-input" type="radio" name="inlineRadioOptions"
                         id="noBetOption">
                  <label class="form-check-label" for="noBetOption">Nie</label>
                </div>
                <button :disabled="!bet.result" @click="betTask" type="submit" class="btn btn-primary">
                  {{ currentPlayer.didBet ? 'Zmień' : 'Obstaw' }}
                </button>
              </div>
              <div v-if="currentPlayer.isActive">
                <p>Poczekaj aż inni gracze skończą obstawiać</p>
              </div>
            </div>
            <div v-else-if="state === 'TASK_EXECUTING'"
                 class="d-flex flex-column justify-content-center align-items-center">
              <div class="card text-center" style="max-width: 20rem; min-height: 20rem; margin-bottom: 20px">
                <div class="card-header">Zadanie {{ task.type == 'PHYSICAL' ? 'ZRĘCZNOŚCIOWE' : 'UMYSŁOWE' }}</div>
                <div class="card-body">
                  <p v-if="!currentPlayer.isActive || task.type == 'PHYSICAL'" class="card-text">{{ task.content }}</p>
                  <p v-else class="card-text">Poczekaj aż inni gracze skończą obstawiać</p>
                </div>
              </div>
              <p>Czy gracz wykonał zadanie?</p>
              <div class="row">
                <button @click="successTask" type="submit" class="btn btn-success col">Tak</button>
                <button @click="failTask" type="submit" class="btn btn-danger col">Nie</button>
              </div>
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
        <div class="card text-center">
          <div class="card-header">Punktacja</div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="player in game.players" class="list-group-item">
                <i v-if="player.isActive" class="bi bi-star-fill"></i>
                <i v-if="player.didBet" class="bi bi-coin"></i>
                <span :class="player.id === currentPlayer.id ? 'fw-bold' : 'fw-normal'">
                  &nbsp;{{ player.name }} {{ player.points }}
                </span>
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
</style>
