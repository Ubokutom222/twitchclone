// For Node.js - make sure to install the 'ws' and 'bufferutil' packages
import { drizzle } from "drizzle-orm/node-postgres";

const db = drizzle({
  connection: process.env.DATABASE_URL!,
});

export default db;
