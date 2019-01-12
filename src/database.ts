import { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } from './config/process';
import { connect } from 'mongoose';
import { logger } from "./logger";

const createUserNameAndPasswordString = (): string => {
    if (DB_USERNAME && DB_PASSWORD) {
        return `${DB_USERNAME}:${DB_PASSWORD}@`;
    }
    return '';
};

export const initConnection = async ()  => {
    logger.debug('Creating database connection');
    await connect(`mongodb://${createUserNameAndPasswordString()}${DB_HOST}:${DB_PORT}/${DB_DATABASE}`);

    logger.info('successfully created database connection to', DB_HOST, DB_DATABASE);
};
