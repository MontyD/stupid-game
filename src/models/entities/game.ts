import { prop, arrayProp, instanceMethod, staticMethod, InstanceType, Typegoose, ModelType  } from 'typegoose';
import { PlayerEntity, PlayerType } from './player';
import { dtoParser } from '../../utils/parser';
import { ObjectId } from 'mongodb';
import { ObjectOfAny } from '../../utils/types';
import { randomString } from '../../utils/random';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const MAX_OBSERVERS = 10;

const dtoProps: ReadonlyArray<(keyof GameType)> = ['code', 'runState', 'players', 'id'];

enum GameRunState {
    WAITING_FOR_PLAYERS_TO_JOIN = 'WAITING_FOR_PLAYERS_TO_JOIN',
    INSTRUCTING = 'INSTRUCTING',
    RUNNING_ROUND = 'RUNNING_ROUND',
    COMPLETED = 'COMPLETED',
    ABORTED = 'ABORTED',
}

export const validateGameCode = (code: string) => Boolean(code && code.length === 5);

export class GameEntity extends Typegoose {

    @staticMethod
    public static findByCode(this: ModelType<GameEntity> & typeof GameEntity, code: string) {
        return this.findOne({ code });
    }

    @staticMethod
    public static async generateHost(this: ModelType<GameEntity> & typeof GameEntity): Promise<GameType> {
        return (new Game({ code: randomString() })).save();
    }

    @prop({ required: true, unique: true, validate: validateGameCode })
    public code!: string;

    @prop({ required: true, default: GameRunState.WAITING_FOR_PLAYERS_TO_JOIN })
    public runState!: GameRunState;

    @arrayProp({ itemsRef: PlayerEntity, default: [] })
    public players!: ObjectId[];

    @instanceMethod
    public toDTO(this: InstanceType<GameEntity>): ObjectOfAny {
        return dtoParser(this, dtoProps);
    }

    @instanceMethod
    public addPlayer(this: InstanceType<GameEntity>, player: PlayerType): Promise<InstanceType<GameEntity>> {
        this.players.push(player._id);
        return this.save();
    }

    @instanceMethod
    public removePlayer(this: InstanceType<GameEntity>, player: PlayerType): Promise<InstanceType<GameEntity>> {
        this.players = this.players.filter(playerObjectId => !playerObjectId.equals(player._id));
        return this.save();
    }

}

export type GameType = InstanceType<GameEntity>;
export const Game = new GameEntity().getModelForClass(GameEntity, { schemaOptions: { collection: 'Games' } });
