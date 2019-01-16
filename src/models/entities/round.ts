import { prop, InstanceType, Typegoose, arrayProp, Ref } from 'typegoose';
import { QuestionEntity, TypeOfQuestion } from './question';

export class RoundEntity extends Typegoose {

    @prop({ required: true })
    public name!: string;

    @prop({ required: true, enum: TypeOfQuestion })
    public type!: TypeOfQuestion;

    @arrayProp({ itemsRef: QuestionEntity, default: [] })
    public questions!: Array<Ref<QuestionEntity>>;

}

export type RoundType = InstanceType<RoundEntity>;
export const Round = new RoundEntity().getModelForClass(RoundEntity, {
    schemaOptions: { collection: 'Rounds' },
});
