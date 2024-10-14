import axios from "axios";
import {CONFIG} from "../config.ts";

const GameService = {
    async createGame() {
        const {data} = await axios.post<Game>(`${CONFIG.API_URL}/games`)
        return data
    },

    async getGame(gameId: string, lang: string) {
        const {data} = await axios.get<Game>(`${CONFIG.API_URL}/games/${gameId}?lang=${lang}`)
        return data
    },

    async getGames() {
        const {data} = await axios.get<Games>(`${CONFIG.API_URL}/games`)
        return data
    },

    async kickPlayerOut(gameId: string, playerId: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/kick-out-player`,
            {playerId: playerId}
        )
        return data
    },

    async joinGame(gameId: string, playerName: string, playerId: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/join`,
            {
                playerName: playerName,
                playerId: playerId
            }
        )
        return data
    },

    async startGame(gameId: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/start`
        )
        return data
    },

    async drawTask(gameId: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/draw-task`
        )
        return data
    },

    async betTask(gameId: string, playerId: string, amount: number, result: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/bet-task`,
            {
                playerId: playerId,
                amount: amount,
                result: result,
            }
        )
        return data
    },

    async completeTask(gameId: string, playerId: string, taskResult: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/complete-task`,
            {
                playerId: playerId,
                taskResult: taskResult,
            }
        )
        return data
    },

    async finishGame(gameId: string) {
        const {data} = await axios.post<{}>(
            `${CONFIG.API_URL}/games/${gameId}/actions/finish`
        )
        return data
    },

}

export interface Games {
    content: Array<GameBasicInfo>,
    hasMore: boolean
}

export interface GameBasicInfo {
    id: string,
    status: string,
    round?: number
    createdAt: string
}

export interface Game {
    id: string,
    status: string,
    players: Array<Player>,
    task?: Task
}

export interface Player {
    id: string,
    name: string,
    points: number,
    didBet: boolean,
    isActive: boolean
}

export interface JoinGameResponse {
    playerId: string
}

export interface Task {
    id: number,
    type: string,
    content: string,
    timeLimit?: string,
}

export enum TaskResult {
    UNDEFINED,
    YES,
    NO
}

export interface Bet {
    amount: number,
    result?: string
}

export default GameService;
