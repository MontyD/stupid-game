import { Socket } from 'socket.io';
import { logger } from '../logger';
import { GameMessages } from '../models/messages/game';
import { GameStore } from '../stores/game-store';

export const createGame = async (socket: Socket): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const newGame = await GameStore.generateGame();
    socket.join(newGame.id);
    socket.emit(GameMessages.CREATED, {
        game: newGame.toDTO(),
    });
};
