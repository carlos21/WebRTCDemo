import {
  Entity,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ObjectIdColumn,
  ObjectID
} from "typeorm";
import { Length, IsNotEmpty } from "class-validator";
import * as bcrypt from "bcryptjs";

@Entity()
@Unique(["username"])
export class User {

  // Properties

  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  @Length(4, 20)
  username: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  @Length(4, 100)
  password: string;

  @Column()
  @IsNotEmpty()
  role: string;

  @Column()
  @CreateDateColumn()
  createdAt: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt?: Date;

  // Initializer

  constructor(
    id: ObjectID, 
    username: string,
    firstName: string,
    lastName: string,
    password: string,
    role: string,
    createdAt: Date,
    updatedAt?: Date
  ) {
    this.id = id;
    this.username = username;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.role = role;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Methods

  hashPassword = () => {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfUnencryptedPasswordIsValid = (unencryptedPassword: string) => {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
}