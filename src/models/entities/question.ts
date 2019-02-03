import { prop, InstanceType, Typegoose, staticMethod, ModelType } from 'typegoose';

export interface QuestionDTO {
    id: string;
    text: string;
    answer: string;
    answerType: AnswerType;
    type: TypeOfQuestion;
    level: QuestionLevel;
    numberOfPointsForWinner: number;
    numberOfPointsForGuesser: number;
    numberOfPointsForTrapper: number;
    winnerText: string;
}

export enum TypeOfQuestion {
    PERSONAL = 'PERSONAL',
    DRAW = 'DRAW',
    LIVE_DRAW = 'LIVE_DRAW',
    CAPTION = 'CAPTION',
}

export enum QuestionLevel {
    EXPLICIT = 'EXPLICIT',
    MODERATE = 'MODERATE',
    MILD = 'MILD',
}

export enum AnswerType {
    DRAWING = 'DRAWING',
    LIVE_DRAW = 'LIVE_DRAW',
    PLAYER_NAME = 'PLAYER_NAME',
    STRING = 'STRING',
}

export class QuestionEntity extends Typegoose {

    @staticMethod
    public static findRandomForType(
        this: ModelType<QuestionEntity> & typeof QuestionEntity,
        type: TypeOfQuestion,
        limit: number
    ): Promise<QuestionType[]> {
        return Question.aggregate([]).match({ type }).sample(limit).exec();
    }

    @prop({ required: true, unique: true })
    public text!: string;

    @prop()
    public answer!: string;

    @prop({ enum: AnswerType, required: true, default: AnswerType.STRING })
    public answerType!: AnswerType;

    @prop({ enum: TypeOfQuestion, required: true })
    public type!: TypeOfQuestion;

    @prop({ enum: QuestionLevel, required: true })
    public level!: QuestionLevel;

    @prop({ required: true })
    public numberOfPointsForWinner!: number;

    @prop({ required: true, default: 0 })
    public numberOfPointsForGuesser!: number;

    @prop({ required: true, default: 0 })
    public numberOfPointsForTrapper!: number;

    @prop()
    public winnerText!: string;

}

export type QuestionType = InstanceType<QuestionEntity>;
export const Question = new QuestionEntity().getModelForClass(QuestionEntity, {
    schemaOptions: {
        collection: 'Questions',
        toObject: {
            virtuals: true,
            versionKey: false,
        },
    },
});
