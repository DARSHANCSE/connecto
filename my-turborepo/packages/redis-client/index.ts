import Redis from 'ioredis'
import dotenv from 'dotenv'
dotenv.config()
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
//   tls: {}
})

redis.on('connect', () => console.log('✅ Connected to Redis'))
redis.on('error', err => console.error('❌ Redis error:', err.message))

export default redis