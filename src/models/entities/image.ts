import { prop, InstanceType, Typegoose, staticMethod, ModelType } from 'typegoose';
import { GameEntity } from './game';
import { ObjectId, Binary } from 'mongodb';
import { PlayerEntity } from './player';
import * as fileType from 'file-type';
import { ValidationError } from '../../controllers/validation-error';

export class ImageEntity extends Typegoose {

    @staticMethod
    public static async createAndSave(
        this: ModelType<ImageEntity> & typeof ImageEntity,
        data: Buffer,
        player: ObjectId,
        game: ObjectId,
        roundIndex: number
    ): Promise<ImageType> {
        const typeOfFile = fileType(data);
        if (!typeOfFile || typeOfFile.mime !== 'image/png') {
            throw new ValidationError('Data must be a valid image');
        }

        return (new Image({ data, player, game, roundIndex })).save();
    }

    @prop({ ref: PlayerEntity, required: true })
    public player!: ObjectId;

    @prop({ ref: GameEntity, required: true })
    public game!: ObjectId;

    @prop({ required: true })
    public roundIndex!: number;

    @prop({ required: true })
    public data!: Binary;

}

export type ImageType = InstanceType<ImageEntity>;
export const Image = new ImageEntity().getModelForClass(ImageEntity, {
    schemaOptions: {
        collection: 'Images',
        toObject: {
            transform: () => ({}),
        },
    },
});
