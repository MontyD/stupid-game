import { GameRunState } from '../models/entities/game';
import { ObjectOfAny } from '../utils/types';

export class Game {

    public static from(gameEntity: ObjectOfAny): Game {
        const game: ObjectOfAny = new this();
        const gameKeys = Object.keys(game);
        Object.keys(gameEntity).forEach(key => {
            if (gameKeys.includes(key)) {
                game[key]  = gameEntity[key];
            }
        });
        return game as Game;
    }

    public runState: GameRunState  = GameRunState.WAITING_FOR_PLAYERS_TO_JOIN;
    public code: string = '';
}
