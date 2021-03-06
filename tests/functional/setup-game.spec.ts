import { createClientSocket } from "./util/create-connection";
import { Client, ClientEvent } from '../../src/client/client';
import 'jest';

describe('game setup', () => {

    let toDisconnect: SocketIOClient.Socket[] = [];

    const createSocket = (): SocketIOClient.Socket => {
        const newSocket = createClientSocket();
        toDisconnect.push(newSocket);
        return newSocket;
    };

    const setupGameForStart = async () => {
        const host = await Client.createAsHost(createSocket());
        let i = 0;
        while (i++ < 3) {
            await Client.joinGameAsPlayer(createSocket(), {
                playerName: `player ${i}`,
                gameCode: host.game!.code,
            });
        }
        return host;
    };

    afterEach(() => {
        toDisconnect.forEach(io => io.disconnect());
        toDisconnect = [];
    });

    it('will create a game', async () => {
        const {game, player, otherPlayers} = await Client.createAsHost(createSocket());
        expect(game!.code.length).toEqual(5);
        expect(game!.runState).toEqual('WAITING_FOR_PLAYERS_TO_JOIN');
        expect(player).not.toBeUndefined();
        expect(player!.name).toEqual('HOST');
        expect(player!.isHost).toBe(true);
        expect(otherPlayers).toHaveLength(0);
    });

    it('will allow players to join the game', async () => {
        const playerJoinedListener = jest.fn();

        const host = await Client.createAsHost(createSocket());
        host.on(ClientEvent.PLAYER_JOINED, playerJoinedListener);
        expect(host.otherPlayers).toEqual([]);

        const activeClient = await Client.joinGameAsPlayer(createSocket(), {
            playerName: 'new-player',
            gameCode: host.game!.code,
        });

        if (!activeClient.game || !host.game || !activeClient.player || !host.player) {
            throw new Error('game or player was null on activeClient or host');
        }

        expect(activeClient.game.id).toEqual(host.game.id);
        expect(activeClient.otherPlayers).toHaveLength(1);
        expect(activeClient.otherPlayers[0].id).toEqual(host.player.id);
        expect(activeClient.player.name).toEqual('new-player');

        expect(host.otherPlayers).toHaveLength(1);
        expect(host.otherPlayers[0]!.id).toEqual(activeClient.player.id);
        expect(host.otherPlayers[0]!.name).toEqual('new-player');

        expect(playerJoinedListener).toHaveBeenCalledWith(host.otherPlayers[0]);
    });

    it('will handle players disconnecting', async (done) => {
        const socketToDisconnect = createClientSocket();
        const host = await Client.createAsHost(createSocket());
        const activePlayerClient = await Client.joinGameAsPlayer(socketToDisconnect, {
            playerName: 'i-will-leave',
            gameCode: host.game!.code,
        });

        host.on(ClientEvent.PLAYER_LEFT, player => {
            expect(player.id).toEqual(activePlayerClient.player!.id);
            expect(host.otherPlayers).toEqual([]);
            done();
        });

        socketToDisconnect.disconnect();
    });

    it('will limit the number of players to 12', async () => {
        const host = await Client.createAsHost(createSocket());
        const players = [];

        let i = 0;
        while (i++ < 12) {
            const newPlayer = await Client.joinGameAsPlayer(createSocket(), {
                playerName: `player ${i}`,
                gameCode: host.game!.code,
            });
            players.push(newPlayer);
        }

        await expect((async () => {
            await Client.joinGameAsPlayer(createSocket(), {
                playerName: 'one player too many',
                gameCode: host.game!.code,
            });
        })()).rejects.toMatchSnapshot();
    });

    it('will only allow the game to start if we have enough players', async () => {
        const host = await Client.createAsHost(createSocket());

        let i = 0;
        while (i++ < 2) {
            await expect((async () => {
                const client = await Client.joinGameAsPlayer(createSocket(), {
                    playerName: `not enough players ${i}`,
                    gameCode: host.game!.code,
                });
                await client.startGame();
            })()).rejects.toMatchSnapshot();
        }
    });

    it('will not start the same game twice', async () => {
        const host = await setupGameForStart();
        await host.startGame();

        await expect((async () => {
            await host.startGame();
        })()).rejects.toMatchSnapshot();
    });

    it('will create a correct game definition on start', async () => {
        const host = await setupGameForStart();
        await host.startGame();

        const { gameDefinition } = host;
        if (!gameDefinition) {
            throw new Error('Game definition was not created');
        }

        expect(host.game!.runState).toEqual('RUNNING_ROUND');
        expect(gameDefinition.rounds).toHaveLength(1);
        expect(gameDefinition.rounds[0].questions).toHaveLength(host.otherPlayers.length);

        // assert that all questions are unique
        const questionsText = gameDefinition.rounds[0].questions.map(question => question.text);
        expect(new Set(questionsText).size).toEqual(questionsText.length);
    });

    it('will not leak messages between games', async () => {
        const [host1, host2] = await Promise.all([
            setupGameForStart(),
            setupGameForStart(),
        ]);

        expect(host1.otherPlayers).not.toContainEqual(host2.otherPlayers);

        await host1.startGame();
        expect(host1.game!.runState).toEqual('RUNNING_ROUND');
        expect(host2.game!.runState).not.toEqual('RUNNING_ROUND');

        await host2.startGame();

        const questionTextForGame1 = host1.gameDefinition!.rounds[0].questions.map(question => question.text);
        const questionTextForGame2 = host2.gameDefinition!.rounds[0].questions.map(question => question.text);

        expect(questionTextForGame1).not.toEqual(questionTextForGame2);
    });

});
