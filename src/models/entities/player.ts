import { prop, InstanceType, Typegoose } from 'typegoose';
import { GameEntity } from './game';
import { makeDTOParser } from '../../utils/parser';
import { ObjectId } from 'mongodb';

const dtoProps: ReadonlyArray<(keyof PlayerType)> = ['name', 'type', 'isHost', 'game', 'id'];

export enum TypeOfPlayer {
    ACTIVE_PLAYER = 'ACTIVE_PLAYER',
    OBSERVER = 'OBSERVER',
}

export class PlayerEntity extends Typegoose {
    @prop({ required: true, validate: (val: string) => typeof val === 'string' })
    public name!: string;

    @prop({ enum: TypeOfPlayer, required: true, default: TypeOfPlayer.ACTIVE_PLAYER })
    public type!: TypeOfPlayer;

    @prop({ default: false, required: true })
    public isHost!: boolean;

    @prop({ ref: GameEntity, required: true })
    public game!: ObjectId;
}

export type PlayerType = InstanceType<PlayerEntity>;
export const Player = new PlayerEntity().getModelForClass(PlayerEntity, { schemaOptions: { collection: 'Players' } });

export const playerToDTO = makeDTOParser<PlayerType>(dtoProps);
