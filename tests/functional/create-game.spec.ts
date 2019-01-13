import { createClientSocket } from "./util/create-connection";
import 'jest';

describe('connection handling', () => {

    let socket: SocketIOClient.Socket;
    let toDisconnect: SocketIOClient.Socket[] = [];

    beforeEach(() => {
        socket = createClientSocket();
        toDisconnect.push(socket);
    });

    afterEach(() => {
        toDisconnect.forEach(io => io.disconnect());
        toDisconnect = [];
    });

    it('will create a game', done => {
        socket.on('GAME:CREATED', ({ game, player }: { game: any, player: any }) => {
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
    });

    it('will allow players to join the game', done => {
        let firstPlayer: any = null;
        socket.on('GAME:CREATED', ({ game, player }: { game: any, player: any }) => {
            const secondSocket = createClientSocket();
            toDisconnect.push(secondSocket);
            firstPlayer = player;
            secondSocket.emit('JOIN_GAME', { gameCode: game.code, playerName: 'another player' });
        });
        socket.on('GAME:PLAYER_JOINED', ({ player, game }: { player: any, game: any }) => {
            expect(game.players.length).toEqual(2);
            expect(game.players).toContain(player.id);
            expect(game.players).toContain(firstPlayer.id);
            expect(player.name).toEqual('another player');
            expect(player.game).toEqual(game.id);
            expect(player.type).toEqual('ACTIVE_PLAYER');
            expect(player.isHost).toBe(false);
            expect(firstPlayer.isHost).toBe(true);
            done();
        });

        socket.on('ERROR', (failure: any) => expect(failure).toBeNull());
        socket.on('VALIDATION_ERROR', (failure: any) => expect(failure).toBeNull());
        socket.emit('CREATE_GAME');
    });

});
