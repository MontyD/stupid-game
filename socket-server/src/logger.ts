import * as pino from 'pino';
import { ENV } from './config/process';

export const logger = pino({
  level: ENV === 'production' ? 'info' : 'trace',
});
