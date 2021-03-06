import express from 'express';
import jwt from "jsonwebtoken";
import config from "../config/config";
import { Repository } from "typeorm";
import { User } from '../storage/entity/User';
import RoutableController from './RoutableController';

export default class AuthorizeController implements RoutableController {

  private path = '/api/authorize';
  private userRepo: Repository<User>;
  router = express.Router();

  constructor(userRepo: Repository<User>) {
    this.userRepo = userRepo;
    this.setupRoutes();
  }

  private setupRoutes = () => {
    this.router.post(this.path, this.authorize);
  }

  authorize = async (request: express.Request, response: express.Response) => {
    try {
      const { username } = request.body;

      // find user
      const user = await this.userRepo.findOneOrFail({ where: { username: username }});

      // generate token
      const token = jwt.sign({
        userId: user.id,
        username: user.username
      }, config.jwtSecret, { expiresIn: "1h" });
      
      response.json({ token: token });

    } catch (error) {
      console.log(error);
      response.status(401).json({ success: false, message: "The username does not exist." });
    }
  }
}