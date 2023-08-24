import TypedStorage from "./storage.ts";
import game, {Bet, Player} from "../services/game.ts";
import {defineStore} from "pinia";
import {computed, ref} from "vue";

export const gameStorage = new TypedStorage<Map<string, JoinedGame>>('games')

export interface JoinedGame {
    gameId: string,
    playerId: string,
    didJoined: boolean,
    bet: Bet
}

export const useGameStore = defineStore('games', () => {
    const games = ref(gameStorage.get())
    const joinedGame = computed((gameId) => games.value?.get(gameId))

    return {
        games
    }
})
