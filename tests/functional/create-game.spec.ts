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
        socket.on('GAME:CREATED', ({game}: {game: any}) => {
            expect(game.code.length).toEqual(5);
            expect(game.id).toBeUndefined();
            done();
        });
        socket.on('ERROR', (failure: any) => expect(failure).toBeNull());
        socket.on('VALIDATION_ERROR', (failure: any) => expect(failure).toBeNull());
        socket.emit('CREATE_GAME');
    }, 200);

});
