import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import { NextFunction, Request, Response } from 'express';

interface AuthReq extends Request {
    user?: string;
}

const authorization = (req: AuthReq, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw Object.assign(new Error("No token available"), { code: 500 });
        }
        const jwtsecret = process.env.JWT_SECRET || 'default_secret';
        const decoded = jwt.verify(token.split(' ')[1],jwtsecret) as any;
        if (decoded) {
             
            req.user = decoded as string;
            // console.log(req.user)
            next();
        }
    } catch (error) {
        next(error);

    }

}

export default authorization