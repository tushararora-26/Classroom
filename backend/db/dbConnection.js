import mongoose from 'mongoose';

/**
 * Serverless invocations reuse a warm module scope, so the connection promise
 * is cached on `globalThis`. Without this, every cold-ish invocation opens a
 * new pool and a busy deploy exhausts the Atlas connection limit.
 */
const globalForMongoose = globalThis;

globalForMongoose.__classroomMongoose ??= { conn: null, promise: null };

const cache = globalForMongoose.__classroomMongoose;

export const connectToDatabase = async (mongoUrl) => {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(mongoUrl, {
        // Fail fast rather than hanging a function until its timeout.
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => {
        cache.conn = m;
        return m;
      })
      .catch((err) => {
        // Clear the cache so the next invocation retries instead of reusing
        // a permanently rejected promise.
        cache.promise = null;
        throw err;
      });
  }

  return cache.promise;
};

/** Long-running (non-serverless) entrypoint: connect once, or exit loudly. */
export const dbConnection = async (mongoUrl) => {
  try {
    await connectToDatabase(mongoUrl);
    console.log('Connected to database');
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
};
