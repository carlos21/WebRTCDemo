import express from 'express';
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import { Application } from 'express';
import http from 'http';
import RoutableController from './controllers/RoutableController';
import SocketIO, { Socket } from 'socket.io';
import config from './config/config';
import redisClient from './storage/Redis';
import { getRepository } from 'typeorm';
import { User } from './storage/entity/User';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import TokenPayloadInterface from './models/TokenPayloadInterface';
import SocketResponse from './responses/SocketResponse';
import { Instruction } from './models/Instruction';

export default class App {
  public app: Application;
  public server: http.Server;
  public port: number;
  private io: SocketIO.Server;

  constructor(appInit: { port: number; middleWares: any; controllers: any; }) {
    this.app = express();
    this.server = new http.Server(this.app);
    this.io = SocketIO();
    this.io.attach(this.server, {
      path: '/socket.io'
    });

    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(bodyParser.json());

    this.port = appInit.port

    this.middlewares(appInit.middleWares)
    this.routes(appInit.controllers)
    this.assets()
    this.template()

    // this.authMiddleware();
    this.listenSocketEvents();
  }

  private middlewares(middleWares: { forEach: (arg0: (middleWare: any) => void) => void; }) {
    middleWares.forEach(middleWare => {
      this.app.use(middleWare)
    })
  }

  private routes(controllers: { forEach: (arg0: (controller: any) => void) => void; }) {
    controllers.forEach(controller => {
      if ((controller as RoutableController).router !== undefined) {
        this.app.use('/', controller.router)
      }
    })
  }

  private assets() {
    this.app.use(express.static('public'))
    this.app.use(express.static('views'))
  }

  private template() {
    this.app.set('view engine', 'pug')
  }

  public listen() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`Server is listening on ${this.port} port`);
    });
  }

  private printUser(socket: Socket) {
    const token = socket.request._query.auth_token;
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayloadInterface;
    const username = payload.username;
    console.log("user: ", username);
  }

  private emitError = (socket: Socket, status: number, message: string = '', show: boolean = false) => {
    const json = { 
      status: status, 
      data: {
        show: show,
        message: message
      } 
    };
    socket.emit('error', json);
  }

  private listenSocketEvents = () => {
    this.io.on('connection', socket => {
      const auth_token = socket.handshake.query.auth_token;
      const room = socket.handshake.query.room;
      console.log(`Connection`);
      console.log(`auth_token`, auth_token);
      console.log(`room`, room);
      console.log(`Requesting to join to room`, room);

      this.io.of('/').in(room).clients((error: any, clients: any) => {
        if (error) throw error;
        console.log(">>> number of clients", clients);

        if (clients.length >= 2) {
          this.emitError(socket, 3, "The meeting is full.", true);
          return;
        }

        socket.join(room, (error) => {
          if (error) {
            console.log('Error when joining', error);
            this.emitError(socket, 2);
            return;
          }

          // if there's already a user in the room
          let instruction = Instruction.None;
          if (clients.length >= 1) {
            instruction = Instruction.SendOffer;
          }

          socket.emit('joined', {
            room: room,
            instruction: instruction,
            socketId: socket.id
          });
        });
      });

      socket.on('offer', (event: any) => {
        console.log(`>>>>>> Offer ${event.sdp}`);
        this.printUser(socket);
        socket.to(event.room).emit('offer', event.sdp);
        console.log('>>>>>>');
        console.log("");
      });

      socket.on('answer', (event: any) => {
        console.log(`>>>>>> Answer ${event.sdp}`);
        this.printUser(socket);
        socket.to(event.room).emit('answer', event.sdp);
        console.log('>>>>>>');
        console.log("");
      });

      socket.on('candidate', (event: any) => {
        console.log(`>>>>>> Candidate ${event}`);
        this.printUser(socket);
        console.log('>>>>>>');
        console.log("");
        const json = {
          type: 'candidate',
          sdpMLineIndex: event.sdpMLineIndex,
          sdpMid: event.sdpMid,
          candidate: event.candidate
        };
        socket.to(event.room).emit('candidate', json);
      });

      socket.on('mute-video', (event: any) => {
        console.log(`mute-video ${event.enabled}`);
        socket.to(event.room).emit('mute-video', event.enabled);
      });

      socket.on('mute-audio', (event: any) => {
        console.log(`mute-audio ${event.enabled}`);
        socket.to(event.room).emit('mute-audio', event.enabled);
      });

      socket.on('message', (event: any) => {
        console.log(`message!!!!!! ${event.text}`);
        socket.to(event.room).emit('message', event);
      });

      socket.conn.on('packet', async (packet: any) => {
        if (packet.type === 'ping') {
          console.log("packet event");
          
          try {
            const token = socket.request._query.auth_token;
            const payload = jwt.verify(token, config.jwtSecret) as TokenPayloadInterface;
            const username = payload.username;
            const response = await redisClient.set(`users:${username}`, socket.id, ['EX', 30], 'XX');
            console.log(response);

            console.log("current socket", socket.id);
            console.log("io.sockets.connected");

          } catch (error) {
            console.log(error);
          }
        }
      });

      socket.on('disconnect', async (reason) => {
        const username = socket.handshake.query.username;
        console.log("disconnect", username);
        await redisClient.del(`users:${username}`);
      });
    });

    this.io.use(async (socket: SocketIO.Socket, next: (error?: Error) => void) => {
      try {
        const token = socket.handshake.query.auth_token;
        const force = socket.handshake.query.force;

        // verify token
        const payload = jwt.verify(token, config.jwtSecret) as TokenPayloadInterface;
        const username = payload.username;
        if (!payload.username) {
          return next(new Error('Authorization failed'));
        }

        // verify user
        const user = await this.verifyUser(username);

        // the user has accepted to created a new connection
        if (force == 'true') {

          // get old socket
          let previousSocketId = await redisClient.get(`users:${username}`);
          console.log("previousSocketId", previousSocketId);
          if (previousSocketId) {
            console.log("forcing disconnection");
            const previousSocket = this.io.sockets.connected[previousSocketId];
            if (previousSocket) {
              previousSocket.disconnect();
            }
          }
          // return next();
        }

        // validate if user is already connected
        const canConnect = await redisClient.set(`users:${user.username}`, socket.id, ['EX', 30], 'NX');
        if (!canConnect) {
          console.log('use - already logged in');
          const error = SocketResponse.buildError("Already logged in", { status: 1, data: {
            show: true,
            message: "You already have an open session in other device. Do you want to close that session and start a new one?"
          }});
          return next(error);
        }

        return next();

      } catch (error) {
        if (error instanceof TokenExpiredError) {
          // refresh token
          // return;
        }
        console.log('authMiddleware - catch', error);
        return next(new Error('Authorization failed'));
      }
    });
  }

  private verifyUser = (username: string) => {
    return new Promise<User>((resolve, reject) => {
      const userRepo = getRepository(User);
      userRepo.findOneOrFail({ where: { username: username } }).then((user: User) => {
        return resolve(user);
      }).catch(error => {
        return reject(error);
      });
    });
  }
}