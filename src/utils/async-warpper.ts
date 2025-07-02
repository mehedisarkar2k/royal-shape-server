import { NextFunction, Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asyncWrapper = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncWrapper;
