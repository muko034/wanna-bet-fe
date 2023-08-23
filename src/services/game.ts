import axios from "axios";
import {CONFIG} from "../config.ts";

const GameService = {
    async createGame() {
        const {data, status} = await axios.post<Game>(`${CONFIG.API_URL}/games`)
        return data
    },

    async getGame(gameId: String) {
        const {data, status} = await axios.get<Game>(`${CONFIG.API_URL}/games/${gameId}`)
        return data
    },

}

export interface Game {
    id: String,
    status: String,
    players: Array<Player>,
}

export interface Player {
    id: String,
    name: String,
    points: number,
    didBet: boolean,
    isActive: boolean
}

export interface JoinGameResponse {
    playerId: String
}

export interface Task {
    id: number,
    type: String,
    content: string
}

export default GameService;
