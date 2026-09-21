/**
 * Local and container entrypoint. Vercel uses api/index.js instead, which
 * exports a handler rather than binding a port.
 */
import { loadEnv } from './config/env.js';
import { dbConnection } from './db/dbConnection.js';
import { buildApp } from './app.js';

const env = loadEnv();

await dbConnection(env.MONGO_URL);

const app = buildApp({ frontendUrl: env.FRONTEND_URL, allowedOrigins: env.ALLOWED_ORIGINS });

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
