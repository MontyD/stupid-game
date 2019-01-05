import * as http from 'http';
import * as io from 'socket.io';
import { PORT } from './config/process';
import { logger } from './logger';
import { handle } from './router';

const createServer = () => {
    const httpServer = http.createServer((req, res) => {
        res.statusCode = 404;
        res.end();
    });
    const ioServer = io(httpServer);

    ioServer.on('connection', handle);

    httpServer.listen(PORT, () => {
        logger.info(`Successfully listening on port ${PORT}`);
    });

};

createServer();
