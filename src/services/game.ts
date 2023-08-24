import axios from "axios";
import {CONFIG} from "../config.ts";

const GameService = {
    async createGame() {
        // @ts-ignore
        const {data, _status} = await axios.post<Game>(`${CONFIG.API_URL}/games`)
        return data
    },

    async getGame(gameId: string) {
        // @ts-ignore
        const {data, status} = await axios.get<Game>(`${CONFIG.API_URL}/games/${gameId}`)
        return data
    },

}

export interface Game {
    id: string,
    status: string,
    players: Array<Player>,
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
