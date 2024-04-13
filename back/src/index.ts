import cors from 'cors';
import express, { Request, Response } from 'express';
import routes from './routes';
import PromptDeamon from './PromptDeamon';
import { resetDb } from './Db';
import { auth } from 'express-openid-connect';

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: 'a long, randomly-generated string stored in env',
  baseURL: 'http://localhost:8080',
  clientID: 'N7MMCbK3Ir1uuSeGvRwu3W1xSyT5PNeS',
  issuerBaseURL: 'https://dev-wpunndg44r5bjef6.us.auth0.com'
};


const app = express();

app.use(express.json());
app.use(cors());
app.use(auth(config));

// To get IP address of the client
app.set('trust proxy', true);

app.use((req: Request, _res: Response, next) => {
    // displaying the path of the request
    console.log(`>>> ${req.method} ${req.path}`);
    next();
});

app.use(routes);

const deamon = PromptDeamon.getInstance();
deamon.run();

resetDb();

const port = 8080;

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});
