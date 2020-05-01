import SocketIO from 'socket.io';
import socketAuth from 'socketio-jwt-auth';
import config from '../config/config';
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { Server } from 'http';

export default class SocketController {

  private io: SocketIO.Server;
  private userRepo: Repository<User>;

  constructor(server: Server, userRepo: Repository<User>) {
    this.io = require("socket.io")(server);
    this.userRepo = userRepo;

    this.setupAuthentication();
    this.setupSocketEvents();
  }

  private setupSocketEvents = () => {
    this.io.on('connection', socket => {
      this.io.emit('Hi there');
    });

    this.io.on('ready', (room: string) => {
      console.log(`Ready ${room}`);
      this.io.in(room).to(room).emit('ready');
    });

    this.io.on('candidate', (event: any) => {
      console.log(`Candidate ${event}`);
      this.io.to(event.room).emit('candidate', event);
    });

    this.io.on('offer', (event: any) => {
      console.log(`Offer ${event}`);
      this.io.to(event.room).emit('offer', event.sdp);
    });

    this.io.on('answer', (event: any) => {
      console.log(`Answer ${event}`);
      this.io.to(event.room).emit('answer', event.sdp);
    });
  }

  private setupAuthentication = () => {
    this.io.use(socketAuth.authenticate({
      secret: config.jwtSecret,
      algorithm: 'HS256'
    }, (payload: any, done: (err?: Error | null, user?: any, message?: string) => void) => {
        
      const username = payload.username;
      console.log(`username ${username}`);
      if (payload.username) {
        return done(null, false, 'Authorization failed');
      }

      // find user
      this.userRepo.findOneOrFail({ where: { username: username } }).then((user: User) => {
        return done(null, user);
      }).catch(error => {
        return done(null, false, 'User not found');
      });

    }));
  }
}