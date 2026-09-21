import express from 'express';
import cors from 'cors';

import authRouter from './routers/authRouter.js';
import studentRouter from './routers/studentRouter.js';
import teacherRouter from './routers/teacherRouter.js';
import classRouter from './routers/classRouter.js';
import eventsRouter from './routers/eventsRouter.js';
import libraryRouter from './routers/libraryRouter.js';
import attendanceRouter from './routers/attendanceRouter.js';
import announcementRouter from './routers/announcementRouter.js';
import assignmentRouter from './routers/assignmentRouter.js';
import submissionRouter from './routers/submissionRouter.js';
import noticeRouter from './routers/noticeRouter.js';

import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';

/**
 * Builds the Express app without binding a port, so tests can drive it
 * through supertest and the entrypoint can own the listener.
 */
export const buildApp = ({
  frontendUrl = 'http://localhost:5173',
  allowedOrigins = [],
} = {}) => {
  const app = express();

  const allowList = new Set(
    [frontendUrl, 'http://localhost:5173', 'http://localhost:4173', ...allowedOrigins].filter(
      Boolean
    )
  );

  // Vercel gives every preview deployment its own hostname, so the frontend's
  // previews are matched by pattern rather than listed one by one.
  const previewPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

  const isAllowedOrigin = (origin) =>
    allowList.has(origin) || previewPattern.test(origin);

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and tooling requests arrive with no Origin header.
        if (!origin || isAllowedOrigin(origin)) return callback(null, true);
        // Deny by simply withholding the header. Throwing here would surface
        // as a 500 with a stack trace for what is a normal, expected refusal;
        // the browser blocks the response either way.
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (req, res) => res.status(200).json({ msg: 'Welcome to Classroom!' }));
  app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));

  // Auth mounts first: its literal paths would otherwise be shadowed by the
  // resource routers' '/:id' patterns.
  app.use('/api/v1', authRouter);

  app.use('/api/v1/students', studentRouter);
  app.use('/api/v1/teachers', teacherRouter);
  app.use('/api/v1/class', classRouter);
  app.use('/api/v1/events', eventsRouter);
  app.use('/api/v1/library', libraryRouter);
  app.use('/api/v1/attendance', attendanceRouter);
  app.use('/api/v1/announcement', announcementRouter);
  app.use('/api/v1/assignments', assignmentRouter);
  app.use('/api/v1/submissions', submissionRouter);
  app.use('/api/v1/notices', noticeRouter);

  // These two are last, in this order. The original code registered the error
  // handler before the routes, where it could never catch anything (B1).
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
