import { Game, GameType } from '../models/entities/game';
import { randomString } from '../utils/random';
import { logger } from '../logger';

export class GameStore {

    public static async generateGame(): Promise<GameType> {
        logger.debug('Generating new game');
        const newGame = await (new Game({code: randomString()})).save();
        return newGame;
    }

    public static async getGameByCode(code: string): Promise<GameType | null> {
        return Game.findOne({code});
    }

}
