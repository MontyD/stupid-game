import { createClientSocket } from "./util/create-connection";

describe('connection handling', () => {

    let socket: SocketIOClient.Socket;

    beforeEach(() => {
        socket = createClientSocket();
    });

    afterEach(() => {
        socket.disconnect();
    });

    it('will connect', done => {
        socket.on('hello', () => {
            socket.emit('hello-indeed');
            done();
        });
    });

    it('will connect again', done => {
        socket.on('hello', () => {
            socket.emit('hello-indeed');
            done();
        });
    });

});
