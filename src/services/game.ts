import axios, {RawAxiosRequestHeaders} from "axios";
import {CONFIG} from "../config.ts";

const GameService = {
    async createGame(lang: string) {
        const {data} = await axios.post<Game>(`${CONFIG.API_URL}/games`, null, {
            headers: {
                'Accept-Language': lang
            } as RawAxiosRequestHeaders
        })
        return data
    },

    async getGame(gameId: string, lang: string) {
        const {data} = await axios.get<Game>(`${CONFIG.API_URL}/games/${gameId}`, {
            headers: {
                'Accept-Language': lang
            } as RawAxiosRequestHeaders
        })
        return data
    },

    async getGames(lang: string) {
        const {data} = await axios.get<Games>(`${CONFIG.API_URL}/games`, {
            headers: {
                'Accept-Language': lang
            } as RawAxiosRequestHeaders
        })
        return data
    },

    async kickPlayerOut(gameId: string, playerId: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/kick-out-player`,
            {
                playerId: playerId
            },
            {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async joinGame(gameId: string, playerName: string, playerId: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/join`,
            {
                playerName: playerName,
                playerId: playerId
            },
            {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async startGame(gameId: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/start`, null, {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async drawTask(gameId: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/draw-task`, null, {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async betTask(gameId: string, playerId: string, amount: number, result: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/bet-task`,
            {
                playerId: playerId,
                amount: amount,
                result: result,
            }, {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async completeTask(gameId: string, playerId: string, taskResult: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/complete-task`,
            {
                playerId: playerId,
                taskResult: taskResult,
            }, {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async finishGame(gameId: string, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/finish`, null, {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
        )
        return data
    },

    async changePlayerPoints(gameId: string, playerId: string, points: number, lang: string) {
        const {data} = await axios.post<Game>(
            `${CONFIG.API_URL}/games/${gameId}/actions/change-player-points`,
            {
                playerId: playerId,
                points: points,
            }, {
                headers: {
                    'Accept-Language': lang
                } as RawAxiosRequestHeaders
            }
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
