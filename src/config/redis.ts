import {createClient} from 'redis';

let redisClient :ReturnType<typeof createClient>;

export const connectRedis = async ()=>{
    redisClient = createClient({
        url:process.env.REDIS_URL
    });
    redisClient.on("error",(err)=>{
        console.error("Redis Client Error",err);        
    })
    redisClient.on("connect",()=>{
        console.log("Redis connected...");
        
    })
    await redisClient.connect()
}

export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error("Redis not initialized. Call connectRedis first.");
  }
  return redisClient;
};