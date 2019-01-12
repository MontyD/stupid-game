import { Socket } from 'socket.io';
import { logger } from './logger';
import { createGame, joinGame } from './controllers/game-controller';
import { TopLevelClientToServerMessages, TopLevelServerToClientMessages } from './models/messages/top-level';

type SocketHandler = (...args: any[]) => void;

export const handle = (socket: Socket): void => {
    logger.debug('handling connection with id', socket.id);

    socket.on(TopLevelClientToServerMessages.CREATE_GAME, handleError(socket, async () => {
        await createGame(socket);
    }));
    socket.on(TopLevelClientToServerMessages.JOIN_GAME, handleError(socket, async (...args: any[]) => {
        await joinGame(socket, ...args);
    }));

    socket.on('disconnect', () => {
        logger.info('disconnecting', socket.id);
    });
};

export const handleError = (socket: Socket, handler: SocketHandler): SocketHandler => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (error) {
            if (error && error.name === 'ValidationError') {
                 socket.emit(TopLevelServerToClientMessages.VALIDATION_ERROR, error.message);
                 return;
            }
            logger.error(
                'Unhandled error in socket handler',
                socket.id,
                error && error.toString(),
                error && error.stack
            );
            socket.emit(TopLevelServerToClientMessages.ERROR, 'Unhandled socket error');
        }
    };
};
