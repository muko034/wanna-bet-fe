import axios from "axios";
import {CONFIG} from "../config.ts";

const GameService = {
    async createGame() {
        const {data} = await axios.post<Game>(`${CONFIG.API_URL}/games`)
        return data
    },

    async getGame(gameId: string) {
        const {data} = await axios.get<Game>(`${CONFIG.API_URL}/games/${gameId}`)
        return data
    },

    async getGames() {
        const {data} = await axios.get<GameBasicInfo[]>(`${CONFIG.API_URL}/games`)
        return data
    },

}

export interface GameBasicInfo {
    id: string,
    status: string,
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
    content: string
}

export interface Bet {
    amount: number,
    result?: string
}

export default GameService;
