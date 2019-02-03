import { prop, InstanceType, Typegoose, staticMethod, ModelType } from 'typegoose';
import { GameEntity, GameType } from './game';
import { ObjectId } from 'mongodb';

export interface PlayerDTO {
    id: string;
    name: string;
    isHost: boolean;
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
            isHost: true,
        };
        return (new Player(newPlayer)).save();
    }

    @staticMethod
    public static generatePlayer(
        this: ModelType<PlayerEntity> & typeof PlayerEntity,
        game: GameType,
        name: string = '',
        socketId: string,
        observer: boolean = false
    ): Promise<PlayerType> {
        return (new Player({
            name,
            socketId,
            game: game._id,
        })).save();
    }

    @staticMethod
    public static findBySocketId(this: ModelType<PlayerEntity> & typeof PlayerEntity, socketId: string) {
        return this.findOne({ socketId });
    }

    @staticMethod
    public static findAllByGame(
        this: ModelType<PlayerEntity> & typeof PlayerEntity,
        game: GameType,
        excludeHost: boolean = false
    ): Promise<PlayerType[]> {
        const extraConditions = excludeHost ? { isHost: false } : {};
        return this.find({ _id: { $in: game.players }, ...extraConditions }).exec();
    }

    @prop({ required: true })
    public name!: string;

    @prop({ default: false, required: true })
    public isHost!: boolean;

    @prop({ required: true, default: 0 })
    public score!: number;

    @prop({ ref: GameEntity, required: true })
    public game!: ObjectId;

    @prop({ required: true, unique: true })
    public socketId!: string;
}

export type PlayerType = InstanceType<PlayerEntity>;
export const Player = new PlayerEntity().getModelForClass(PlayerEntity, {
    schemaOptions: {
        collection: 'Players',
        toObject: {
            virtuals: true,
            versionKey: false,
        },
    },
});
