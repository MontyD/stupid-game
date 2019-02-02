import { Round } from '../models/entities/game-definition';
import { TypeOfQuestion } from '../models/entities/question';
import { ValidationError } from './validation-error';
import { Server } from 'socket.io';
import { DrawRoundController } from './draw-round-controller';
import { RoundController } from './round-controller';
import { PlayerType } from '../models/entities/player';
import { GameType } from '../models/entities/game';

const roundControllers: Map<string, RoundController> = new Map<string, RoundController>();

export const getRoundControllerFor = (
    round: Round,
    server: Server,
    players: PlayerType[],
    game: GameType
): RoundController => {
    if (round.type === TypeOfQuestion.DRAW) {
        return new DrawRoundController(round, server, players, game);
    }
    throw new ValidationError(`Unsupported round type ${round.type}`);
};

export const getRoundControllerForGame = (gameId: string): RoundController | undefined  => {
    return roundControllers.get(gameId);
};

export const deleteRoundControllerForGame = (gameId: string): void  => {
    roundControllers.delete(gameId);
};
