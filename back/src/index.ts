import cors from 'cors';
import express, { Request, Response } from 'express';
import routes from './routes';
import PromptDeamon from './PromptDeamon';
import path from "path"
import { resetDb } from './Db';
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(express.json());
app.use(cors());

// To get IP address of the client
app.set('trust proxy', true);

app.use(express.static(path.join("public")));
app.use((req: Request, _res: Response, next) => {
    // displaying the path of the request
    console.log(`>>> ${req.method} ${req.path}`);
    next();
});

app.use("/api", routes);

const proxy = createProxyMiddleware({
    target: process.env.VITE_DEV_SERVER,
    changeOrigin: true,
    ws: true
});

app.use(
    '/',
    (_req, res, next) => {
        if (
            process.env.NODE_ENV &&
            process.env.NODE_ENV === 'development' &&
            process.env.USE_VITE_SERVER &&
            process.env.USE_VITE_SERVER === 'true'
        ) {
            return next();
        }
        res.sendFile(path.join(__dirname,"..","public",'/index.html'));
    },
    proxy
);

const deamon = PromptDeamon.getInstance();
deamon.run();

resetDb();

const port = 8080;

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});
