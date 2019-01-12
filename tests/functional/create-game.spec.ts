import { createClientSocket } from "./util/create-connection";
import 'jest';

describe('connection handling', () => {

    let socket: SocketIOClient.Socket;

    beforeEach(() => {
        socket = createClientSocket();
    });

    afterEach(() => {
        socket.disconnect();
    });

    it('will create a game', done => {
        socket.on('GAME:CREATED', ({game, player}: {game: any, player: any}) => {
            expect(game.code.length).toEqual(5);
            expect(game.id.length).toEqual(24);
            expect(game.players.length).toEqual(1);
            expect(game.players[0]).toEqual(player.id);
            expect(player.isHost).toBe(true);
            expect(player.type).toEqual('OBSERVER');
            done();
        });
        socket.on('ERROR', (failure: any) => expect(failure).toBeNull());
        socket.on('VALIDATION_ERROR', (failure: any) => expect(failure).toBeNull());
        socket.emit('CREATE_GAME');
    }, 200);

    fit('will create a game that players can join', done => {
        let firstPlayer: any = null;
        socket.on('GAME:CREATED', ({game, player}: {game: any, player: any}) => {
            const secondSocket = createClientSocket();
            firstPlayer = player;
            secondSocket.emit('JOIN_GAME', {gameCode: game.code, playerName: 'another player'});
        });
        socket.on('GAME:PLAYER_JOINED', ({player}: {player: any}) => {
            done();
        });

        socket.on('ERROR', (failure: any) => expect(failure).toBeNull());
        socket.on('VALIDATION_ERROR', (failure: any) => expect(failure).toBeNull());
        socket.emit('CREATE_GAME');
    }, 300);

});
