import { Entity, Column, Index, OneToMany } from 'typeorm';
import { Player } from './player';
import { BaseEntity } from './base-entity';

@Entity()
export class Game extends BaseEntity {

    @Column()
    @Index()
    public code: string;

    @OneToMany(() => Player, player => player.game)
    public players?: Player[];

    constructor(code: string) {
        super();
        this.code = code;
    }

    public getPlayers(): Player[] {
        return this.players ? this.players : [];
    }

}
