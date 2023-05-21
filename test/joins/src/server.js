const http = require("http");
const {
  graphql: { execute, subscribe },
} = require("sigue");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { createHandler } = require("graphql-http/lib/use/http");
const routes = require("./routes");

const setHeaders = (res) => {
  Object.keys(headers).forEach((key) => {
    res.setHeader(key, headers[key]);
  });
};

const thirtyDays = 30 * 24 * 60 * 60;
const headers = {
  "Access-Control-Allow-Origin": "*" /* @dev First, read about security */,
  "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
  "Access-Control-Max-Age": thirtyDays,
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization,X-Requested-With,content-type",
  "Access-Control-Allow-Credentials": true,
  "content-type": "application/json",
  /** add other headers as per requirement */
};


const createServer = ({ schema }) => {
  const PORT = process.env.PORT || 4000;

  // Create the GraphQL over HTTP Node request handler
  const handler = createHandler({ schema });

  // Create a HTTP server using the listner on `/graphql`
  const server = http.createServer((req, res) => {


    if (req.method === "OPTIONS") {
      res.writeHead(204, headers);
      res.end();
      return;
    }

    let routeFound = false;
    Object.keys(routes).find((key) => {
      routes[key](req, res, setHeaders) ? (routeFound = true) : null;
      return routeFound;
    });
    if (routeFound) return;


    if (req.url.startsWith("/graphql")) {
      Object.keys(headers).forEach((key) => {
        res.setHeader(key, headers[key]);
      });
      handler(req, res);
    } else {
      res.writeHead(404).end();
    }
  });

  server.listen(PORT, () => {
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema,
        onConnect: (connectionParams, webSocket) => {
          console.log("Client connected");
        },
        onDisconnect: (webSocket, context) => {
          console.log("Client disconnected");
        },
      },
      {
        server: server,
        path: "/",
      }
    );
  });

  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`);
  console.log(
    "Check the API at https://studio.apollographql.com/sandbox/explorer"
  );
};

exports.createServer = createServer;
