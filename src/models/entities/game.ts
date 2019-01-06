import { Entity, Column, ObjectIdColumn, Index, OneToMany } from 'typeorm';
import { Player } from './player';

@Entity()
export class Game {

    @ObjectIdColumn()
    public readonly id!: string;

    @Column()
    public name: string;

    @Column()
    @Index()
    public code: string;

    @OneToMany(() => Player, player => player.game)
    public players!: Player[];

    constructor(name: string, code: string) {
        this.name = name;
        this.code = code;
    }

}
