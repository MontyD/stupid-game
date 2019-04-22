import { prop, InstanceType, Typegoose, staticMethod, ModelType } from 'typegoose';
import { GameEntity, GameType } from './game';
import { ObjectId, Binary } from 'mongodb';
import { PlayerEntity } from './player';
import * as fileType from 'file-type';
import { ValidationError } from '../../controllers/validation-error';

export class ImageEntity extends Typegoose {

    @staticMethod
    public static async createAndSave(
        this: ModelType<ImageEntity> & typeof ImageEntity,
        data: unknown,
        player: ObjectId,
        game: ObjectId,
        roundIndex: number
    ): Promise<ImageType> {
        if (!Buffer.isBuffer(data)) {
            throw new ValidationError('Image data must be a buffer');
        }
        if (data.byteLength > 2000000) {
            throw new ValidationError('Image data is too large');
        }

        const typeOfFile = fileType(data);
        if (!typeOfFile || typeOfFile.mime !== 'image/png') {
            throw new ValidationError('Data must be a valid image');
        }

        return (new Image({ data, player, game, roundIndex })).save();
    }

    @staticMethod
    public static async getByGameAndRoundIndex(
        this: ModelType<ImageEntity> & typeof ImageEntity,
        game: GameType,
        roundIndex: number
    ): Promise<ImageType|null> {
         const image = await this.findOne({ game: game._id, active: true, roundIndex });
         if (!image) {
             return null;
         }
         return image;
    }

    @prop({ ref: PlayerEntity, required: true })
    public player!: ObjectId;

    @prop({ ref: GameEntity, required: true })
    public game!: ObjectId;

    @prop({ required: true })
    public roundIndex!: number;

    @prop({ required: true })
    public data!: Binary;

    @prop({ required: true, default: true })
    public active!: boolean;

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
