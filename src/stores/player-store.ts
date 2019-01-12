import { Player, PlayerType, TypeOfPlayer } from '../models/entities/player';
import { GameType } from '../models/entities/game';
import { logger } from '../logger';

export class PlayerStore {

    public static generateObserverPlayer(game: GameType): Promise<PlayerType> {
        logger.debug('Generating observer player for game', game._id);
        const newPlayer = {
            name: 'a',
            game,
            type: TypeOfPlayer.OBSERVER,
            isHost: true,
        };
        return (new Player(newPlayer)).save();
    }

}
