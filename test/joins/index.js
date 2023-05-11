const http = require('http');
const { createHandler }  = require('graphql-http/lib/use/http');
const { schema: schemGenerator, getModels }  = require("sigue")
const env = process.env.NODE_ENV || 'development';

// Set up the database
const db = getModels({
  db_url: process.env.DATABASE_URL || require("./config/config")[env]?.url,
  config: require("./config/config")[env],
  modelsDirectory: __dirname + "/models"
})

// Sync the database tables
db.sequelize.sync().then(() => {
  console.log("Database is ready")
})

// Construct a schema, using GraphQL schema language
var schema = schemGenerator(db.sequelize.models);
// Create the GraphQL over HTTP Node request handler

const handler = createHandler({ schema });

// Create a HTTP server using the listner on `/graphql`
const server = http.createServer((req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,content-type',
    "Access-Control-Allow-Credentials" : true,
    "content-type": "application/json"
    /** add other headers as per requirement */
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (req.url.startsWith('/graphql')) {
    Object.keys(headers).forEach((key) => {
      res.setHeader(key, headers[key]);
    });
    handler(req, res);
  } else {
    res.writeHead(404).end();
  }
});

server.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql")
console.log("Check the API at https://studio.apollographql.com/sandbox/explorer")


