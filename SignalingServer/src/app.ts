import express from 'express';
import helmet from "helmet";
import cors from "cors";
import bodyParser from "body-parser";
import { Application } from 'express';
import { Server } from 'http';
import RoutableController from './controllers/RoutableController';

export default class App {
  public app: Application;
  public server: Server;
  public port: number;

  constructor(app: Application, server: Server, appInit: { port: number; middleWares: any; controllers: any; }) {
    this.app = app;
    this.server = server;
    this.app.use(cors());
    this.app.use(helmet());
    this.app.use(bodyParser.json());

    this.port = appInit.port

    this.middlewares(appInit.middleWares)
    this.routes(appInit.controllers)
    this.assets()
    this.template()
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
}