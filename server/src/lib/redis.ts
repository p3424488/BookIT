import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    tls: process.env.REDIS_URL?.startsWith('rediss://') ? true : false,
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