import { GameDTO, GameType, MAX_PLAYERS, MIN_PLAYERS, GameRunState } from "../models/entities/game";
import { ValidationError } from "../controllers/validation-error";

export const assertCanStart = (game: GameDTO | GameType): true => {
    const numberOfPlayersExcludingHost = game.players.length - 1;
    if (numberOfPlayersExcludingHost > MAX_PLAYERS) {
        throw new ValidationError('Too many players to start game - this shouldn\'t ever happen');
    }
    if (numberOfPlayersExcludingHost < MIN_PLAYERS) {
        throw new ValidationError('Not enough players to start game');
    }
    if (game.runState !== GameRunState.WAITING_FOR_PLAYERS_TO_JOIN) {
        throw new ValidationError('Game in wrong state to start');
    }
    return true;
};
