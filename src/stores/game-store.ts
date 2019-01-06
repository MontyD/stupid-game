import { getManager } from 'typeorm';
import { Game } from '../models/entities/game';
import { randomString } from '../utils/random';
import { logger } from '../logger';

export class GameStore {

    public static async generateGame(): Promise<Game> {
        logger.debug('Generating new game');
        return this.saveGame(new Game(randomString()));
    }

    public static saveGame(game: Game): Promise<Game> {
        logger.debug('Saving game', game.id, game.code);
        return getManager().save(game);
    }

}
