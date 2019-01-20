import { Round } from '../models/entities/game-definition';
import { TypeOfQuestion } from '../models/entities/question';
import { ValidationError } from './validation-error';
import { Server } from 'socket.io';
import { DrawRoundController } from './draw-round-controller';
import { RoundController } from './round-controller';

export const getRoundControllerFor = (round: Round, server: Server, gameId: string): RoundController => {
    if (round.type === TypeOfQuestion.DRAW) {
        return new DrawRoundController(round, server, gameId);
    }
    throw new ValidationError(`Unsupported round type ${round.type}`);
};
