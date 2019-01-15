import { ObjectOfAny } from '../utils/types';
import { TypeOfPlayer } from '../models/entities/player';

export class Player {

    public static from(playerEntity: ObjectOfAny): Player {
        const player: ObjectOfAny = new Player();
        const playerKeys = Object.keys(player);
        Object.keys(playerEntity).forEach(key => {
            if (playerKeys.includes(key)) {
                player[key]  = playerEntity[key];
            }
        });
        return player as Player;
    }

    public id: string = '';
    public name: string = '';
    public type: TypeOfPlayer = TypeOfPlayer.OBSERVER;
    public isHost: boolean = false;
}
