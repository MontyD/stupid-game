import { prop, InstanceType, Typegoose } from 'typegoose';

export enum TypeOfQuestion {
    PERSONAL = 'PERSONAL',
    DRAW = 'DRAW_QUESTION',
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

    @prop({ required: true })
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
    schemaOptions: { collection: 'Questions' },
});
