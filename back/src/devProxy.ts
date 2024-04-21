const { createProxyMiddleware } = require('http-proxy-middleware');
import { Request, Response, NextFunction } from 'express';

export const useProxyIfDev = () => {
    console.log('oyi');
    console.log(process.env.NODE_ENV);
    console.log(process.env.USE_VITE_SERVER);
    if (
        process.env.NODE_ENV === 'development' &&
        process.env.USE_VITE_SERVER === 'true'
    ) {
        console.log('redirecting to proxy');
        const proxy = createProxyMiddleware({
            target: process.env.VITE_DEV_SERVER,
            changeOrigin: true,
            ws: true
        });
        return proxy;
    }
    return (_req: Request, _res: Response, next: NextFunction) => {
        console.log('production build');
        next();
    };
};
