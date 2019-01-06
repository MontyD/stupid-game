import { Entity, Column, ManyToOne } from 'typeorm';
import { Game } from './game';
import { BaseEntity } from './base-entity';

export enum PlayerType {
    ACTIVE_PLAYER = 'ACTIVE_PLAYER',
    OBSERVER = 'OBSERVER',
}

@Entity()
export class Player extends BaseEntity {

    @Column()
    public name: string;

    @Column()
    public type: PlayerType;

    @Column()
    public isHost: boolean;

    @ManyToOne(() => Game, game => game.players)
    public game: Game;

    constructor(name: string, game: Game, type: PlayerType = PlayerType.ACTIVE_PLAYER, isHost = false) {
        super();
        this.name = name;
        this.game = game;
        this.type = type;
        this.isHost = isHost;
    }

}
