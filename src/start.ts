import * as http from 'http';
import * as io from 'socket.io';
import { PORT } from './config/process';
import { logger } from './logger';
import { handle } from './router';
import * as database from './database';
import { runMigrations } from './migrations/run-migrations';

const createServer = async () => {
    const httpServer = http.createServer((req, res) => {
        res.statusCode = 404;
        res.end();
    });
    const ioServer = io(httpServer);

    ioServer.on('connection', (socket: io.Socket) => {
        handle(socket, ioServer);
    });

    await database.initConnection();

    await runMigrations();

    httpServer.listen(PORT, () => {
        logger.info(`Successfully listening on port ${PORT}`);
    });

};

createServer().catch(error => {
    logger.error(error);
    process.exit(1);
});
