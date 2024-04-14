import cors from 'cors';
import express, { Request, Response } from 'express';
import routes from './routes';
import PromptDeamon from './PromptDeamon';
import { resetDb } from './Db';
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(express.json());
app.use(cors());

// To get IP address of the client
app.set('trust proxy', true);

app.use((req: Request, _res: Response, next) => {
    // displaying the path of the request
    console.log(`>>> ${req.method} ${req.path}`);
    next();
});

app.use(routes);

const proxy = createProxyMiddleware({
  target: process.env.VITE_DEV_SERVER,
  changeOrigin: true,
  ws: true,
});
app.use('/', proxy);

const deamon = PromptDeamon.getInstance();
deamon.run();

resetDb();

const port = 8080;

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});
