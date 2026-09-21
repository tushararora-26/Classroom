import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler } from '../middlewares/errorHandler.js';
import { notFound } from '../middlewares/notFound.js';

const buildApp = (handler) => {
  const app = express();
  app.get('/boom', handler);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

describe('errorHandler', () => {
  it('uses the status code carried by ApiError', async () => {
    const app = buildApp(
      asyncHandler(async () => {
        throw new ApiError(403, 'Not your class');
      })
    );

    const res = await request(app).get('/boom');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Not your class' });
  });

  it('maps a Mongoose CastError to 400', async () => {
    const app = buildApp(
      asyncHandler(async () => {
        const err = new Error('Cast to ObjectId failed');
        err.name = 'CastError';
        err.path = 'classId';
        throw err;
      })
    );

    const res = await request(app).get('/boom');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/classId/);
  });

  it('maps a duplicate key error to 409', async () => {
    const app = buildApp(
      asyncHandler(async () => {
        const err = new Error('E11000 duplicate key');
        err.code = 11000;
        err.keyValue = { email: 'taken@example.com' };
        throw err;
      })
    );

    const res = await request(app).get('/boom');

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/);
  });

  it('defaults an unknown error to 500 without leaking its message', async () => {
    const app = buildApp(
      asyncHandler(async () => {
        throw new Error('connection string user:hunter2 refused');
      })
    );

    const res = await request(app).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal Server Error');
  });

  it('returns a JSON 404 for an unmatched route', async () => {
    const app = buildApp(asyncHandler(async (req, res) => res.json({})));

    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
