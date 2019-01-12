import { prop, Ref, arrayProp, instanceMethod, InstanceType, Typegoose  } from 'typegoose';
import { Player, PlayerEntity, PlayerType } from './player';

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

export const validateGameCode = (code: string) => Boolean(code && code.length === 5);

export class GameEntity extends Typegoose {

    @prop({ required: true, unique: true, validate: validateGameCode })
    public code!: string;

    @prop({ required: true, default: GameRunState.WAITING_FOR_PLAYERS_TO_JOIN })
    public runState!: GameRunState;

    @arrayProp({ itemsRef: PlayerEntity, default: [] })
    public players!: Array<Ref<PlayerEntity>>;

    @instanceMethod
    public addPlayer(this: InstanceType<GameEntity>, player: PlayerType): Promise<InstanceType<GameEntity>> {
        this.players.push(player);
        return this.save();
    }

}

export type GameType = InstanceType<GameEntity>;
export const Game = new GameEntity().getModelForClass(GameEntity);
