import { InstanceType, Typegoose, arrayProp, Ref, staticMethod, ModelType } from 'typegoose';
import { TypeOfQuestion, QuestionType, Question } from './question';
import { GameType } from './game';
import { ValidationError } from 'mongoose';

export interface GameDefinitionDTO {
    id: string;
    rounds: Round[];
}

const DEFAULT_ROUNDS = [{
    questionType: TypeOfQuestion.DRAW,
    questionAmount: 5,
}];

class Round {
    constructor(public type: TypeOfQuestion, public questions: QuestionType[] = []) { }
}

export class GameDefinitionEntity extends Typegoose {

    @staticMethod
    public static async generate(
        this: ModelType<GameDefinitionEntity> & typeof GameDefinitionEntity
    ): Promise<GameDefinitionType> {
        const rounds: Round[] = [];
        for (const {questionType, questionAmount} of DEFAULT_ROUNDS) {
            const questions = await Question.findRandomForType(questionType, questionAmount);
            rounds.push(new Round(questionType, questions));
        }
        const gameDef = new GameDefinition({ rounds });
        return gameDef.save();
    }

    @staticMethod
    public static async findByGame(
        this: ModelType<GameDefinitionEntity> & typeof GameDefinitionEntity,
        game: GameType
    ): Promise<GameDefinitionType> {
        const gameDef = await this.findById(game.gameDefinition);
        if (!gameDef) {
            throw new ValidationError(`Could not find game definition for given game`);
        }
        return gameDef;
    }

    @arrayProp({ default: [], items: Round })
    public rounds!: Round[];

}

export type GameDefinitionType = InstanceType<GameDefinitionEntity>;
export const GameDefinition = new GameDefinitionEntity().getModelForClass(GameDefinitionEntity, {
    schemaOptions: { collection: 'GameDefinitions' },
});
