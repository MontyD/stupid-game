import { prop, InstanceType, Typegoose, instanceMethod, staticMethod, ModelType } from 'typegoose';
import { GameEntity, GameType } from './game';
import { dtoParser } from '../../utils/parser';
import { ObjectId } from 'mongodb';
import { ObjectOfAny } from '../../utils/types';

const dtoProps: ReadonlyArray<(keyof PlayerType)> = ['name', 'type', 'isHost', 'game', 'id'];

export enum TypeOfPlayer {
    ACTIVE_PLAYER = 'ACTIVE_PLAYER',
    OBSERVER = 'OBSERVER',
}

export class PlayerEntity extends Typegoose {

    @staticMethod
    public static generateHostPlayer(
        this: ModelType<PlayerEntity> & typeof PlayerEntity,
        game: GameType,
        socketId: string
    ): Promise<PlayerType> {
        const newPlayer = {
            socketId,
            name: 'HOST',
            game: game._id,
            type: TypeOfPlayer.OBSERVER,
            isHost: true,
        };
        return (new Player(newPlayer)).save();
    }

    @staticMethod
    public static generatePlayer(
        this: ModelType<PlayerEntity> & typeof PlayerEntity,
        game: GameType,
        name: string,
        socketId: string,
        observer: boolean = false
    ): Promise<PlayerType> {
        return (new Player({
            name,
            socketId,
            game: game._id,
            type: observer ? TypeOfPlayer.OBSERVER : TypeOfPlayer.ACTIVE_PLAYER,
        })).save();
    }

    @staticMethod
    public static findBySocketId(this: ModelType<PlayerEntity> & typeof PlayerEntity, socketId: string) {
        return this.findOne({ socketId });
    }

    @prop({ required: true, validate: (val: string) => typeof val === 'string' })
    public name!: string;

    @prop({ enum: TypeOfPlayer, required: true, default: TypeOfPlayer.ACTIVE_PLAYER })
    public type!: TypeOfPlayer;

    @prop({ default: false, required: true })
    public isHost!: boolean;

    @prop({ ref: GameEntity, required: true })
    public game!: ObjectId;

    @prop({ required: true, unique: true })
    public socketId!: string;

    @instanceMethod
    public toDTO(this: InstanceType<PlayerEntity>): ObjectOfAny {
        return dtoParser(this, dtoProps);
    }
}

export type PlayerType = InstanceType<PlayerEntity>;
export const Player = new PlayerEntity().getModelForClass(PlayerEntity, { schemaOptions: { collection: 'Players' } });
