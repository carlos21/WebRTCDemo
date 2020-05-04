import express from 'express';
import App from './app';
import AuthorizeController from './controllers/AuthorizeController';
import SocketController from './controllers/SocketController';
import loggerMiddleware from './middleware/logger'
import bodyParser from "body-parser";
import { getRepository, createConnection } from 'typeorm';
import { User } from './storage/entity/User';

createConnection().then(async connection => {
  await connection.runMigrations();
}).then(() => {
  const userRepo = getRepository(User);
  const application = new App({
    port: 9000,
    controllers: [
      new AuthorizeController(userRepo)
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
