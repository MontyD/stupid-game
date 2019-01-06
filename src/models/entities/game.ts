import { Entity, Column, Index, OneToMany } from 'typeorm';
import { Player, PlayerType } from './player';
import { BaseEntity } from './base-entity';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const MAX_OBSERVERS = 10;

enum GameRunState {
    WAITING_FOR_PLAYERS_TO_JOIN = 'WAITING_FOR_PLAYERS_TO_JOIN',
    INSTRUCTING = 'INSTRUCTING',
    RUNNING_ROUND = 'RUNNING_ROUND',
    COMPLETED = 'COMPLETED',
    ABORTED = 'ABORTED',
}

@Entity()
export class Game extends BaseEntity {

    @Column()
    @Index()
    public code: string;

    @Column()
    public runState: GameRunState;

    @OneToMany(() => Player, player => player.game)
    public players?: Player[];

    constructor(code: string) {
        super();
        this.code = code;
        this.runState = GameRunState.WAITING_FOR_PLAYERS_TO_JOIN;
    }

    public getActivePlayers(): Player[] {
        const players = this.players || [];
        return players.filter(player => player.type === PlayerType.OBSERVER);
    }

    public getObserverPlayers(): Player[] {
        const players = this.players || [];
        return players.filter(player => player.type === PlayerType.OBSERVER);
    }

    public canStart(): boolean {
        const {length} = this.getActivePlayers();
        return length >= MIN_PLAYERS && length <= MAX_PLAYERS;
    }

    public addPlayer(player: Player): void {
        const currentPlayers: Player[] = this.players || [];
        const hasPlayer = currentPlayers.some(existingPlayer => player.equals(existingPlayer));
        if (!hasPlayer) {
            currentPlayers.push(player);
            this.players = currentPlayers;
        }
    }

}
