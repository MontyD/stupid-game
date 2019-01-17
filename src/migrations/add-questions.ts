import { Question } from "../models/entities/question";
import { Migration } from './migration';
import { ObjectOfAny } from "../utils/types";
import { resolve } from "path";
import { readFile } from "fs";
import { promisify } from "util";

const readFileAsync = promisify(readFile);

const getQuestionsData = async (): Promise<ObjectOfAny[]> => {
    const path = resolve('data', 'questions.json');
    const fileContent = await readFileAsync(path, 'utf8');
    return JSON.parse(fileContent).questions as ObjectOfAny[];
};

const shouldAddQuestions = async () => {
    const dbQuestionAmount = await Question.count({});
    const fileQuestionAmount = (await getQuestionsData()).length;
    return dbQuestionAmount < fileQuestionAmount;
};

const addQuestions = async () => {
    const questions = await getQuestionsData();
    const promises = questions.map(question => {
        const questionEntity = new Question(question);
        return questionEntity.save();
    });
    await Promise.all(promises);
    return true;
};

export const addQuestionsMigration = new Migration(shouldAddQuestions, addQuestions);
