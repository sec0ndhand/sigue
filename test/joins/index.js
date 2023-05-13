const { schema: schemaGenerator, getModels } = require("sigue");
const env = process.env.NODE_ENV || "development";
const { createServer } = require("./src/server.js");
const { pubsub } = require("./src/redis-subscriptions.js");

// Set up the database
const db = getModels({
  db_url: process.env.DATABASE_URL || require("./config/config")[env]?.url,
  config: require("./config/config")[env],
  modelsDirectory: __dirname + "/models",
});

// Sync the database tables
db.sequelize.sync().then(() => {
  console.log("Database is ready");
});


// Set up the redis pubsub
// defaultOptions.pubsub = pubsub

// Construct a schema, using GraphQL schema language

var schema = schemaGenerator(db.sequelize.models, {
  pubsub,
  authenticated: (resolver) => async (parent, args, context, info) => {
    console.log({ parent, args, context, info });
    return resolver(parent, args, context, info);
  },
});

// Start the server
createServer({ schema });
console.log(Object.keys(pubsub));
