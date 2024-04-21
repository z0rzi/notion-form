const { createProxyMiddleware } = require('http-proxy-middleware');
import { Request, Response, NextFunction } from 'express';

export const useProxyIfDev = () => {
    if (
        process.env.NODE_ENV === 'development' &&
        process.env.USE_VITE_SERVER === 'true'
    ) {
        const proxy = createProxyMiddleware({
            target: process.env.VITE_DEV_SERVER,
            changeOrigin: true,
            ws: true
        });
        return proxy;
    }
    return (_req: Request, _res: Response, next: NextFunction) => {
        next();
    };
};
