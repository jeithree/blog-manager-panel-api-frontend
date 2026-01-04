import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import {RedisStore} from 'connect-redis';
import redisClient from './redisClient.ts';
import {
	PORT,
	API_URL,
	SITE_URL,
	SESSION_SECRET,
	SESSION_REDIS_PREFIX,
} from './configs/basics.ts';
import {SESSION_COOKIE} from './configs/cookies.ts';
import {errorHandler} from './middlewares/errorHandler.ts';
import router from './routes/index.ts';

const app = express();

// Settings
app.set('trust proxy', 1);
app.set('port', PORT);

// Middlewares
app.use(helmet());
app.use(
	cors({
		origin: [API_URL, SITE_URL],
		credentials: true,
	})
);
app.use(express.urlencoded({extended: false, limit: '10mb'}));
app.use(express.json({limit: '10mb'}));
app.use(cookieParser(SESSION_SECRET));
app.use(
	session({
		name: SESSION_COOKIE.name,
		secret: [SESSION_SECRET], // first element has to be the new secret, read Docs
		resave: false,
		saveUninitialized: false,
		cookie: SESSION_COOKIE.options,
		store: new RedisStore({
			client: redisClient,
			prefix: SESSION_REDIS_PREFIX,
		}),
	})
);

// Routes
app.use('/api/v1', router);

// Error Handler
app.use(errorHandler);

export default app;
