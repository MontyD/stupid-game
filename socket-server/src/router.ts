import { Socket } from 'socket.io';
import { logger } from './logger';

export const handle = (socket: Socket): void => {
    logger.debug('handling connection with id', socket.id);

    socket.on('')

    socket.on('disconnect', () => {
        logger.info(`disconnecting, id = ${socket.id}`);
    });
};
