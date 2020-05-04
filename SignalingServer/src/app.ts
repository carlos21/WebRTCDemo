import express from 'express';
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import { Application } from 'express';
import http from 'http';
import RoutableController from './controllers/RoutableController';
import SocketIO from 'socket.io';
import socketAuth from 'socketio-jwt-auth';
import config from './config/config';
import redisClient from './storage/Redis';
import { getRepository } from 'typeorm';
import { User } from './storage/entity/User';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import TokenPayloadInterface from './models/TokenPayloadInterface';
import ResponseError from './responses/ResponseError';
import SocketResponse from './responses/SocketResponse';

export default class App {
  public app: Application;
  public server: http.Server;
  public port: number;
  private io: SocketIO.Server;

  constructor(appInit: { port: number; middleWares: any; controllers: any; }) {
    this.app = express();
    this.server = new http.Server(this.app);
    this.io = SocketIO();
    this.io.attach(this.server);

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
    this.server.listen(this.port);
  }

  private listenSocketEvents = () => {
    this.io.on('connection', socket => {
      const auth_token = socket.handshake.query.auth_token;
      const room = socket.handshake.query.room;
      console.log(`Connection`);
      console.log(`auth_token`, auth_token);
      console.log(`Requesting to join to room`, room);
      
      socket.join(room, () => {
        socket.emit('joined', room);
      });

      socket.on('candidate', (event: any) => {
        console.log(`Candidate ${event}`);
        socket.to(event.room).emit('candidate', event);
      });

      socket.on('offer', (event: any) => {
        console.log(`Offer ${event.sdp}`);
        socket.to(event.room).emit('offer', event.sdp);
      });

      socket.on('answer', (event: any) => {
        console.log(`Answer ${event.sdp}`);
        socket.to(event.room).emit('answer', event.sdp);
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
          } });
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