import { Entity, ObjectIdColumn, Column, ManyToOne } from 'typeorm';
import { Game } from './game';

@Entity()
export class Player {

    @ObjectIdColumn()
    public id!: string;

    @Column()
    public name: string;

    @ManyToOne(() => Game, game => game.players)
    public game: Game;

    constructor(name: string, game: Game) {
        this.name = name;
        this.game = game;
    }

}
