import express from 'express';
import App from './app';
import AuthorizeController from './controllers/AuthorizeController';
import SocketController from './controllers/SocketController';
import loggerMiddleware from './middleware/logger'
import bodyParser from "body-parser";
import { getRepository, createConnection } from 'typeorm';
import { User } from './storage/entity/User';
import promiseRetry from 'promise-retry';

promiseRetry((retry: (error: any) => never, attempts: number) => {

  console.log("STARTING THE CONNECTION");
  console.log('attempt number', attempts);
  
  return createConnection().catch(retry);

}, { retries: 5, minTimeout: 10000 }).then(connection => {

  console.log("RUNNING MIGRATIONS");
  return connection.runMigrations();
  
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
  console.log("STARTING THE APP");
  application.listen();

}).catch(error => {
  console.log("ERROR STARTING THE APP", error);
});