import { loadEnv } from '../config/env.js';
import { connectToDatabase } from '../db/dbConnection.js';
import { buildApp } from '../app.js';

/**
 * Nothing is initialised at module scope. A throw during module evaluation
 * on Vercel surfaces only as FUNCTION_INVOCATION_FAILED with no indication of
 * the cause, so config and database errors are raised inside the handler
 * instead, where they can be reported as a readable response.
 */
let cached = null;

const getApp = () => {
  if (!cached) {
    const env = loadEnv();
    cached = {
      env,
      app: buildApp({
        frontendUrl: env.FRONTEND_URL,
        allowedOrigins: env.ALLOWED_ORIGINS,
      }),
    };
  }

  return cached;
};

const fail = (res, status, message) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success: false, message }));
};

export default async function handler(req, res) {
  let env;
  let app;

  try {
    ({ env, app } = getApp());
  } catch (err) {
    // Misconfiguration: name the missing variable rather than crashing blind.
    console.error('Configuration error:', err.message);
    return fail(res, 500, err.message);
  }

  try {
    await connectToDatabase(env.MONGO_URL);
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return fail(res, 503, 'Database unavailable, please try again');
  }

  return app(req, res);
}
