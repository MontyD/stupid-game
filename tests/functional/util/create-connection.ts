import * as client from 'socket.io-client';
import { PORT } from './config';

export const createClientSocket = (): SocketIOClient.Socket => {
    return client(`http://localhost:${PORT}`);
};
