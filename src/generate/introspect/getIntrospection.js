const axios = require('axios');

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        ...FullType
      }
      directives {
        name
        description
        locations
        args {
          ...InputValue
        }
      }
    }
  }

  fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
  }

  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }

  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
        }
      }
    }
  }
`;

async function getIntrospection(graphQLUrl) {
  try {
    const response = await axios.post(
      graphQLUrl,
      {
        query: INTROSPECTION_QUERY,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.errors) {
      throw new Error(`Error introspecting schema: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data.data;
  } catch (error) {
    throw new Error(`Error fetching introspection data: ${error}`);
  }
}

exports.getIntrospection = getIntrospection;
exports.INTROSPECTION_QUERY = INTROSPECTION_QUERY;

// // Usage
// const graphQLUrl = 'http://localhost:4000/graphql'; // Replace with your GraphQL API URL

// getIntrospection(graphQLUrl)
//   .then((data) => {
//     console.log('Introspection Data:', data);
//   })
//   .catch((error) => {
//     console.error('Error:', error);
//   });
