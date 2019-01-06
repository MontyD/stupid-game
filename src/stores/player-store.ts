import { getManager } from 'typeorm';
import { Player, PlayerType } from '../models/entities/player';
import { Game } from '../models/entities/game';
import { logger } from '../logger';

export class PlayerStore {

    public static generateObserverPlayer(game: Game): Promise<Player> {
        logger.debug('Generating observer player for game', game.id);
        return this.savePlayer(new Player('', game, PlayerType.OBSERVER, true));
    }

    public static savePlayer(player: Player): Promise<Player> {
        return getManager().save(player);
    }

}
