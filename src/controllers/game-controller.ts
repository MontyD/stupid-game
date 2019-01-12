import { Socket } from 'socket.io';
import { logger } from '../logger';
import { GameMessages } from '../models/messages/game';
import { GameStore } from '../stores/game-store';
import { PlayerStore } from '../stores/player-store';
import { playerToDTO } from '../models/entities/player';
import { gameToDTO } from '../models/entities/game';

export const createGame = async (socket: Socket): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const game = await GameStore.generateGame();
    const hostPlayer = await PlayerStore.generateHostPlayer(game);

    await game.addPlayer(hostPlayer);

    socket.join(game.id);
    socket.emit(GameMessages.CREATED, {
        player: playerToDTO(hostPlayer),
        game: gameToDTO(game),
    });
};

export const joinGame = async (socket: Socket, ...args: any[]) => {
    const {gameCode, playerName}: {gameCode: string, playerName: string} = args[0] || {};
    logger.info('joining game', gameCode, playerName, socket.id);

    const game = await GameStore.getGameByCode(gameCode);
    if (game === null) {
        throw new Error(`Could not find game with code ${gameCode}`);
    }

    socket.join(game.id);
};
