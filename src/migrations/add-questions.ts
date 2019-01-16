import { Question } from "../models/entities/question";
import { Migration } from './migration';
import * as data from '../data/questions.json';

const shouldAddQuestions = async () => {
    return (await Question.count({})) === data.questions.length;
};

const addQuestions = async () => {
    const promises = data.questions.map(question => {
        const questionEntity = new Question(question);
        return questionEntity.save();
    });
    await Promise.all(promises);
    return true;
};

export const addQuestionsMigration = new Migration(shouldAddQuestions, addQuestions);
