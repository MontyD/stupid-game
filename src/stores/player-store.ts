import { Player, PlayerType, TypeOfPlayer } from '../models/entities/player';
import { GameType } from '../models/entities/game';
import { logger } from '../logger';

export class PlayerStore {

    public static generateHostPlayer(game: GameType): Promise<PlayerType> {
        logger.debug('Generating observer player for game', game.id);
        const newPlayer = {
            name: 'HOST',
            game: game._id,
            type: TypeOfPlayer.OBSERVER,
            isHost: true,
        };
        return (new Player(newPlayer)).save();
    }

}
