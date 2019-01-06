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

    it('will create a game that can be connected to', done => {
        const startTime = Date.now();
        socket.on('GAME:CREATED', ({game}: {game: any}) => {
            expect(game.id).not.toBeUndefined();
            expect(game.code.length).toEqual(5);
            expect(game.id).not.toBeUndefined();
            expect(game.name).toEqual('new game');
            done();
        });
        socket.on('ERROR', (failure: any) => expect(failure).toBeNull());
        socket.emit('CREATE_GAME', {gameName: 'new game'});
    }, 150);

});
