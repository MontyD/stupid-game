import "reflect-metadata"; // required for typeorm
import {createConnection, Connection} from "typeorm";
import {DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, ENV} from './config/process';
import { logger } from "./logger";
import { Game } from "./models/entities/game";
import { Player } from "./models/entities/player";

export let connection: Connection;

export const initConnection = async ()  => {
    logger.debug('Creating database connection');
    if (connection && connection.isConnected) {
        throw new Error('tried to reconnect with a valid connection already open');
    }

    connection = await createConnection({
        type: 'mongodb',
        host: DB_HOST,
        port: DB_PORT,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
        entities: [
            Game,
            Player,
        ],
        synchronize: true,
        logging: ENV !== 'production',
        migrations: [
            'migrations/**/*.ts',
        ],
    });

    logger.info('successfully created database connection to', DB_HOST, DB_DATABASE);
};
