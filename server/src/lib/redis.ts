import { createClient } from 'redis';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.log('Redis max retries reached — continuing without Redis');
        return false;
      }
      return retries * 500;
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully ✅');
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.log('Redis not available — seat locking will be limited');
  }
};

export default redisClient;