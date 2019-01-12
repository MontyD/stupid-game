import { Socket } from 'socket.io';
import { logger } from '../logger';
import { GameMessages } from '../models/messages/game';
import { GameStore } from '../stores/game-store';
import { PlayerStore } from '../stores/player-store';

export const createGame = async (socket: Socket): Promise<void> => {
    logger.info('creating game for socket', socket.id);
    const game = await GameStore.generateGame();
    const hostPlayer = await PlayerStore.generateObserverPlayer(game);

    await game.addPlayer(hostPlayer);

    socket.join(game.id);
    socket.emit(GameMessages.CREATED, {});
};
