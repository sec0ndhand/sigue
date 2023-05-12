const { RedisPubSub } = require('graphql-redis-subscriptions');
const Redis = require( 'ioredis' );

const options = {
    host: process.env.REDIS_DOMAIN_NAME || 'localhost',
    port: process.env.REDIS_PORT_NUMBER || 6379,
    retryStrategy: times => {
      // reconnect after
      return Math.min(times * 50, 2000);
    }
  };

const pubsub = new RedisPubSub({
  connectionListener: (err) => console.log(err),
  publisher: new Redis(options),
  subscriber: new Redis(options),
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
});

module.exports = { pubsub };
