import { getDatabase } from '../src/lib/database';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
const db = getDatabase();
console.log('CinemaGo database initialized:', process.env.CINEMAGO_DB_PATH || 'data/cinemago.sqlite');
console.log(db.prepare('SELECT count(*) AS movies FROM movies').get());
