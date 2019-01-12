import { prop, Ref, InstanceType, Typegoose } from 'typegoose';
import { GameEntity } from './game';

export enum TypeOfPlayer {
    ACTIVE_PLAYER = 'ACTIVE_PLAYER',
    OBSERVER = 'OBSERVER',
}

export class PlayerEntity extends Typegoose {
    @prop({ required: true })
    public name!: string;

    @prop({ enum: TypeOfPlayer, required: true, default: TypeOfPlayer.ACTIVE_PLAYER })
    public type!: TypeOfPlayer;

    @prop({ default: false, required: true })
    public isHost!: boolean;

    @prop({ ref: GameEntity, required: true })
    public game!: Ref<GameEntity>;
}

export type PlayerType = InstanceType<PlayerEntity>;
export const Player = new PlayerEntity().getModelForClass(PlayerEntity);
