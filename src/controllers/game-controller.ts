import { Socket } from 'socket.io';
import { getManager } from "typeorm";
import { logger } from '../logger';
import { TopLevelServerToClientMessages } from '../models/messages/top-level';
import { Game } from '../models/entities/game';
import { randomString } from '../utils/random';
import { GameMessages } from '../models/messages/game';

const emitError = (socket: Socket, errorMessage: string) => {
    logger.info(`Handled client error: ${errorMessage}`, socket.id);
    socket.emit(TopLevelServerToClientMessages.ERROR, {
        message: errorMessage,
    });
};

export const createGame = async (socket: Socket, {gameName}: {gameName?: string} = {}): Promise<void> => {
    logger.debug('creating game', gameName, socket.id);

    if (typeof gameName !== 'string') {
        emitError(socket, 'must provide game name as a string');
        return;
    }

    const game = new Game(gameName, randomString());
    await getManager().save(game);
    socket.emit(GameMessages.CREATED, {game});
};
