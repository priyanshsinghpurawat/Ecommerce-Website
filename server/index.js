/**
 * Server entry point — loads .env, connects MongoDB, starts Express on PORT.
 * HTTP routes live in app.js; business logic in controllers/.
 * Beginner docs: docs/DEVELOPER_GUIDE.md
 */
import dotenv from 'dotenv';
dotenv.config();

import connectDB from './config/db.js';
import { app } from './app.js';

const PORT = Number(process.env.PORT) || 3000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`MensVibe API → http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use. Run: npm run free-port`);
        process.exit(1);
      }
      throw err;
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
  });
