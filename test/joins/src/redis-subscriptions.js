const { RedisPubSub } = require('graphql-redis-subscriptions');
const Redis = require( 'ioredis' );
const { PubSub } = require('graphql-subscriptions');
const pubsubmemory = new PubSub();


const options = {
    host: process.env.REDIS_DOMAIN_NAME || 'localhost',
    port: process.env.REDIS_PORT_NUMBER || 6379,
    retryStrategy: times => {
      // reconnect after
      return Math.min(times * 50, 2000);
    }
  };

const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
  connectionListener: (err) => {
    if (err) {
      console.error(err);
    }
    console.info('Pubsub: Succefully connected to redis');
  }
});

const pubsubexport = process.env.NODE_ENV === 'production' ? pubsub : pubsubmemory;

module.exports = { pubsub: pubsubexport };
