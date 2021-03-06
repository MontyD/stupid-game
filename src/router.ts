import { Socket, Server } from 'socket.io';
import { logger } from './logger';
import { createGame, joinGame, disconnectPlayer } from './controllers/game-controller';
import { TopLevelClientToServerMessages, TopLevelServerToSingleClientMessages } from './models/messages/top-level';
import { validationErrorName, ValidationError } from './controllers/validation-error';

type SocketHandler = (...args: any[]) => void;

export const handle = (socket: Socket, server: Server): void => {
    logger.debug('handling connection', socket.id);

    socket.on(TopLevelClientToServerMessages.CREATE_GAME, handleError(socket, async () => {
        await createGame(socket, server);
    }));
    socket.on(TopLevelClientToServerMessages.JOIN_GAME, handleError(socket, async (...args: any[]) => {
        await joinGame(socket, server, args[0]);
    }));
    socket.on('disconnect', handleError(socket, async () => {
        await disconnectPlayer(socket, server);
    }));
};

export const handleError = (socket: Socket, handler: SocketHandler): SocketHandler => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (error) {
            emitSocketError(socket, error);
        }
    };
};

export const emitSocketError = (socket: Socket, error: Error) => {
    if (ValidationError.isValidationError(error)) {
        socket.emit(TopLevelServerToSingleClientMessages.VALIDATION_ERROR, error.message);
        return;
    }
    logger.error(
        'Unhandled error in socket handler',
        socket.id,
        error && (error as Error).toString(),
        error && (error as Error).stack
    );
    socket.emit(TopLevelServerToSingleClientMessages.ERROR, 'Unhandled socket error');
};
