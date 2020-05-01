import express, { Router } from 'express';

export default interface RoutableController {
  router: Router;
}