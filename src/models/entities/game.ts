import { prop, arrayProp, instanceMethod, staticMethod, InstanceType, Typegoose, ModelType  } from 'typegoose';
import { PlayerEntity, PlayerType } from './player';
import { ObjectId } from 'mongodb';
import { randomString } from '../../utils/random';
import { GameDefinitionEntity, GameDefinitionType } from './game-definition';
import { ValidationError } from '../../controllers/validation-error';
import { assertCanStart } from '../../functions/game-functions';

export interface GameDTO {
    id: string;
    code: string;
    runState: GameRunState;
    currentRoundIndex: number;
    currentQuestionIndex: number;
    players: string[];
    numberOfActivePlayers: number;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;

export enum GameRunState {
    WAITING_FOR_PLAYERS_TO_JOIN = 'WAITING_FOR_PLAYERS_TO_JOIN',
    RUNNING_ROUND = 'RUNNING_ROUND',
    SHOWING_SCORES = 'SHOWING_SCORES',
    COMPLETED = 'COMPLETED',
    ABORTED = 'ABORTED',
}

export const validateGameCode = (code: string) => Boolean(code && code.length === 5);

export class GameEntity extends Typegoose {

    @staticMethod
    public static async findByCode(
        this: ModelType<GameEntity> & typeof GameEntity,
        code: string = ''
    ): Promise<GameType> {
        const game = await this.findOne({ code });
        if (!game) {
            throw new Error(`Cannot find game by code ${code}`);
        }
        return game;
    }

    @staticMethod
    public static async get(
        this: ModelType<GameEntity> & typeof GameEntity,
        id: string
    ): Promise<GameType> {
        const game = await this.findById(id);
        if (!game) {
            throw new Error(`Cannot find game by ObjectId(${id})`);
        }
        return game;
    }

    @staticMethod
    public static async generateHost(
        this: ModelType<GameEntity> & typeof GameEntity
    ): Promise<GameType> {
        return (new Game({ code: randomString() })).save();
    }

    @prop({ required: true, unique: true, validate: validateGameCode })
    public code!: string;

    @prop({ required: true, default: GameRunState.WAITING_FOR_PLAYERS_TO_JOIN })
    public runState!: GameRunState;

    @prop({ required: true, default: 0 })
    public currentRoundIndex!: number;

    @prop({ required: true, default: 0 })
    public currentQuestionIndex!: number;

    @arrayProp({ itemsRef: PlayerEntity, default: [] })
    public players!: ObjectId[];

    @prop({ ref: GameDefinitionEntity })
    public gameDefinition?: ObjectId;

    @prop()
    get numberOfActivePlayers() {
        // Don't count the host in the amount of players
        return this.players.length - 1;
    }

    @instanceMethod
    public addPlayer(this: InstanceType<GameEntity>, player: PlayerType): Promise<InstanceType<GameEntity>> {
        if (this.runState !== GameRunState.WAITING_FOR_PLAYERS_TO_JOIN) {
            throw new ValidationError('Cannot add player while game is in progress');
        }
        if (this.numberOfActivePlayers === MAX_PLAYERS) {
            throw new ValidationError('Game is full');
        }
        this.players.push(player._id);
        return this.save();
    }

    @instanceMethod
    public removePlayer(this: InstanceType<GameEntity>, player: PlayerType): Promise<InstanceType<GameEntity>> {
        this.players = this.players.filter(playerObjectId => !playerObjectId.equals(player._id));
        return this.save();
    }

    @instanceMethod
    public start(
        this: InstanceType<GameEntity>,
        gameDefinition: GameDefinitionType
    ): Promise<InstanceType<GameEntity>> {
        assertCanStart(this);
        this.gameDefinition = gameDefinition._id;
        this.runState = GameRunState.RUNNING_ROUND;
        return this.save();
    }
}

export type GameType = InstanceType<GameEntity>;
export const Game = new GameEntity().getModelForClass(GameEntity, {
    schemaOptions: {
        collection: 'Games',
        toObject: {
            virtuals: true,
            versionKey: false,
        },
    },
});
