import { getManager } from 'typeorm';
import { Game } from '../models/entities/game';
import { randomString } from '../utils/random';

export class GameStore {

    public static async generateGame(): Promise<Game> {
        return this.saveGame(new Game(randomString()));
    }

    public static saveGame(game: Game): Promise<Game> {
        return getManager().save(game);
    }

}
