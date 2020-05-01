import express from 'express';
import App from './app';
import AuthorizeController from './controllers/AuthorizeController';
import SocketController from './controllers/SocketController';
import loggerMiddleware from './middleware/logger'
import bodyParser from "body-parser";
import { getRepository, createConnection } from 'typeorm';
import { User } from './entity/User';
import { Server } from 'http';

createConnection().then(async connection => {
  await connection.runMigrations();
}).then(() => {
  const userRepo = getRepository(User);
  const app = express();
  const server = new Server(app);
  
  const application = new App(app, server, {
    port: 9000,
    controllers: [
      new AuthorizeController(userRepo),
      new SocketController(server, userRepo)
    ],
    middleWares: [
      bodyParser.json(),
      bodyParser.urlencoded({ extended: true }),
      loggerMiddleware
    ]
  });

  application.listen();
}).catch(error => {
  console.log("Error starting app", error);
});
