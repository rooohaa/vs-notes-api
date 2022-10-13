import 'reflect-metadata';
require('dotenv-safe').config();
import express from 'express';
import { DataSource } from 'typeorm';
import { __prod__ } from './constants';
import { User } from './entities/User';
import { Strategy as GitHubStrategy } from 'passport-github';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import cors from 'cors';

const main = async () => {
  const app = express();

  const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    database: 'vs-notes',
    entities: [User],
    synchronize: !__prod__,
    logging: !__prod__,
  });

  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized');

    // const userRepository = AppDataSource.getRepository(User);
    // const users = await userRepository.find();

    // console.log(users);
  } catch (err) {
    console.log('Database connection error. ', err);
  }

  passport.serializeUser(function (user: any, done) {
    done(null, user.accessToken);
  });

  app.use(cors({ origin: '*' }));
  app.use(passport.initialize());

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: 'http://localhost:3002/auth/github/callback',
      },
      async (_, __, profile, cb) => {
        let user = await User.findOne({ where: { githubId: profile.id } });

        if (user) {
          user.name = profile.displayName;
          await user.save();
        } else {
          user = await User.create({
            name: profile.displayName,
            githubId: profile.id,
          }).save();
        }

        cb(null, {
          accessToken: jwt.sign(
            { userId: user.id },
            process.env.APP_SECRET_KEY,
            {
              expiresIn: '1y',
            }
          ),
        });
      }
    )
  );

  app.get('/auth/github', passport.authenticate('github', { session: false }));

  app.get(
    '/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/login',
      session: false,
    }),
    (req: any, res) => {
      res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`);
    }
  );

  app.get('/', (_req, res) => {
    res.send('hello !');
  });

  app.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.send({ user: null });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.send({ user: null });
      return;
    }

    let userId = '';

    try {
      const payload: any = jwt.verify(token, process.env.APP_SECRET_KEY);
      userId = payload.userId;
    } catch (err) {
      res.send({ user: null });
      return;
    }

    if (!userId) {
      res.send({ user: null });
      return;
    }

    const user = await User.findOneBy({ id: +userId });

    res.send({ user });
  });

  app.listen(3002, () => {
    console.log('listening on localhost:3002');
  });
};

main();
