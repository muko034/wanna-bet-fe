<script setup lang="ts">
import {useRoute} from "vue-router";
import {computed, ref} from "vue";
import GameService, {Game, Player, Task} from "../services/game.ts";
import Stomp from "webstomp-client"
import {CONFIG} from "../config.ts";
import {v4 as uuidv4} from 'uuid';
import {ToastProps, useToast} from "vue-toast-notification";

const route = useRoute()
const gameId = computed<string>(() => route.params.gameId as string)
const game = ref<Game>({
  id: gameId.value,
  status: '',
  players: []
})
const state = computed<string>(() => {
  if (!currentPlayerJoined.value) {
    return 'ENTERED'
  }
  if (game.value.status === 'CREATED') {
    return 'JOINED'
  }
  if (notRepliedRequests.value.length > 0) {
    return 'LOADING'
  }
  return game.value.status
})
const playerName = ref('')
const task = ref<Task>({
  id: 0,
  type: '',
  content: ''
})
const playerId = uuidv4()
const currentPlayer = computed<Player>(() => game.value.players.find((it) => it.id == playerId.toString()) ?? {
  id: playerId,
  name: playerName.value,
  points: 0,
  didBet: false,
  isActive: false
})
const betAmount = ref<number>(1)
const betResult = ref<string>('')

const currentPlayerJoined = ref(false)
const notRepliedRequests = ref([])
function deleteFromNotRepliedRequests(requestId: string) {
  const index = notRepliedRequests.value.indexOf(requestId)
  if (index !== -1) {
    notRepliedRequests.value.splice(index, 1);
  }
}

const stompClient = Stomp.client(CONFIG.WS_URL);

const $toast = useToast();
const toastProps: ToastProps = {
  position: 'top-right',
  duration: 3000
}

function toastError(message: string) {
  $toast.error(message, toastProps)
}

connect()
refreshGame()

function refreshGame() {
  GameService.getGame(gameId.value).then((res: Game) => {
    game.value = res
  })
}

function joinGame() {
  const requestId = uuidv4();
  stompClient.send("/app/join-game", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value,
    playerName: playerName.value,
    playerId: playerId
  }))
  notRepliedRequests.value.push(requestId)
}

function startGame() {
  const requestId = uuidv4();
  stompClient.send("/app/start-game", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value
  }))
  notRepliedRequests.value.push(requestId)
}

function betTask() {
  const requestId = uuidv4();
  stompClient.send("/app/bet-task", JSON.stringify({
    requestId: requestId,
    playerId: playerId,
    amount: betAmount.value,
    result: betResult.value,
  }))
  notRepliedRequests.value.push(requestId)
}

function successTask() {
  const requestId = uuidv4();
  stompClient.send("/app/complete-task", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value,
    taskResult: 'YES',
  }))
  notRepliedRequests.value.push(requestId)
}

function failTask() {
  const requestId = uuidv4();
  stompClient.send("/app/complete-task", JSON.stringify({
    requestId: requestId,
    gameId: gameId.value,
    taskResult: 'NO',
  }))
  notRepliedRequests.value.push(requestId)
}

function connect() {
  stompClient.connect(
      {},
      frame => {
        stompClient.subscribe(`/topic/games/${gameId.value}/events/player-joined`, msg => {
          const event = JSON.parse(msg.body)
          if (playerId === event.playerId) {
            currentPlayerJoined.value = true
          }
          game.value = event.game
          deleteFromNotRepliedRequests(event.correlationId)
        });
        stompClient.subscribe(`/topic/games/${gameId.value}/events/game-started`, msg => {
          const event = JSON.parse(msg.body)
          game.value = event.game
          deleteFromNotRepliedRequests(event.correlationId)
        });
        stompClient.subscribe(`/topic/games/${gameId.value}/events/task-drawn`, msg => {
          const event = JSON.parse(msg.body)
          game.value = event.game
          betAmount.value = 1
          betResult.value = ''
          deleteFromNotRepliedRequests(event.correlationId)
        });
        stompClient.subscribe(`/topic/games/${gameId.value}/events/player-bet`, msg => {
          const event = JSON.parse(msg.body)
          game.value = event.game
          deleteFromNotRepliedRequests(event.correlationId)
        });
        stompClient.subscribe(`/topic/games/${gameId.value}/events/all-player-bet`, msg => {
          const event = JSON.parse(msg.body)
          game.value = event.game
          deleteFromNotRepliedRequests(event.correlationId)
        });
        stompClient.subscribe(`/topic/games/${gameId.value}/events/task-completed`, msg => {
          const event = JSON.parse(msg.body)
          game.value = event.game
          deleteFromNotRepliedRequests(event.correlationId)
        });
        stompClient.subscribe(`/user/queue/errors`, msg => {
          const error = JSON.parse(msg.body)
          toastError(error.message)
        });
      },
      error => {
        console.error(error);
      }
  );
}

function disconnect() {
  if (stompClient) {
    stompClient.disconnect();
  }
}

</script>

<template>
  <div class="container mt-5">
    <div class="card" style="width: 18rem;">
      <div class="card-body">
        <h5 class="card-title">{{ currentPlayer.name }}</h5>
        <p class="card-text">{{ currentPlayer.points }}</p>
      </div>
    </div>
    <div v-if="state === 'ENTERED'" id="join">
      <div class="mb-3">
        <label for="playerNameInput" class="form-label">Imię</label>
        <input v-model="playerName" type="text" class="form-control" id="playerNameInput"
               placeholder="Wprowadź twoje imię">
      </div>
      <button @click="joinGame" type="submit" class="btn btn-primary">Dołącz</button>
    </div>
    <div v-else-if="state === 'JOINED'">
      <button :disabled="game.players.length < 2" @click="startGame" type="submit" class="btn btn-primary">Start
      </button>
    </div>
    <div v-else-if="state === 'BETTING'">
      <p>Betting</p>
      <div class="card" style="width: 18rem;">
        <div class="card-body">
          <h5 class="card-title">Zadanie {{ task.type == 'PHYSICAL' ? 'ZRĘCZNOŚCIOWE' : 'UMYSŁOWE' }}</h5>
          <p v-if="!currentPlayer.isActive || task.type == 'PHYSICAL'" class="card-text">{{ task.content }}</p>
        </div>
      </div>
      <div v-if="!currentPlayer.isActive">
        <label for="amountInput" class="form-label">Ile obstawiasz? {{ betAmount }}</label>
        <input v-model="betAmount" type="range" class="form-range" id="amountInput" min="1"
               :max="Math.floor(currentPlayer.points / 2)">
        <div class="form-check form-check-inline">
          <input v-model="betResult" value="YES" class="form-check-input" type="radio" name="inlineRadioOptions"
                 id="yesBetOption">
          <label class="form-check-label" for="yesBetOption">Tak</label>
        </div>
        <div class="form-check form-check-inline">
          <input v-model="betResult" value="NO" class="form-check-input" type="radio" name="inlineRadioOptions"
                 id="noBetOption">
          <label class="form-check-label" for="noBetOption">Nie</label>
        </div>
        <button @click="betTask" type="submit" class="btn btn-primary">Obstaw</button>
      </div>
      <div v-if="currentPlayer.isActive">
        <p>Poczekaj aż inni gracze skończą obstawiać</p>
      </div>
    </div>
    <div v-else-if="state === 'TASK_EXECUTING'">
      <p>Czy gracz wykonał zadanie?</p>
      <button @click="successTask" type="submit" class="btn btn-success">Tak</button>
      <button @click="failTask" type="submit" class="btn btn-danger">Nie</button>
    </div>
    <div v-else-if="state === 'LOADING'">
      <div class="spinner-border" role="status">
        <span class="sr-only"></span>
      </div>
    </div>
    <div>
      <p>Players:</p>
      <ul class="list-group">
        <li v-for="player in game.players" class="list-group-item">
          <i v-if="player.isActive" class="bi bi-star-fill"></i>
          <i v-if="player.didBet" class="bi bi-coin"></i>
          {{ player.name }} {{ player.points }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>

</style>
