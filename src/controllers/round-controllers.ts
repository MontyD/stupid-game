import { Round } from '../models/entities/game-definition';
import { TypeOfQuestion } from '../models/entities/question';
import { ValidationError } from './validation-error';
import { Server } from 'socket.io';
import { DrawRoundController } from './draw-round-controller';
import { RoundController } from './round-controller';
import { PlayerType } from '../models/entities/player';

export const getRoundControllerFor = (
    round: Round,
    server: Server,
    players: PlayerType[],
    gameId: string
): RoundController => {
    if (round.type === TypeOfQuestion.DRAW) {
        return new DrawRoundController(round, server, players, gameId);
    }
    throw new ValidationError(`Unsupported round type ${round.type}`);
};
