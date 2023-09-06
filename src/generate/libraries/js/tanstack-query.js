const { generateQueryFields } = require("../../generateQueryFields");

function generateOperations(introspectionJson, operationType, reactQueryHook) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const typesMap = {};
    types.forEach((type) => {
      typesMap[type.name] = type;
    });

    const operationFields = typesMap[operationType.name]?.fields || [];
    const files = [];

    operationFields.forEach((field) => {
      const functionName = field.name;
      const queryName = functionName;
      const returnFields = generateQueryFields(field.type, typesMap);
      const query = `${operationType.kind.toLowerCase()} ${queryName} {\n${field.name} {\n${returnFields}\n}\n}`;

      files.push({
        fileName: `${field.name}.ts`,
        fileContents: `
  import { ${reactQueryHook} } from 'react-query';
  import { graphQL } from './graphQL';

  export const ${functionName}Query = \`${query}\`;

  export function use${functionName.capitalize()}(variables?: any) {
    return ${reactQueryHook}('${queryName}', async () => {
      return graphQL(${functionName}Query, variables);
    });
  }
  `,
      });
    });

    return files;
  }

  String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }

  function generateQueryFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { queryType, mutationType, subscriptionType } = __schema;

    const files = [
      {
        fileName: 'graphQL.ts',
        fileContents: `
  export async function graphQL(query: string, variables?: any) {
    const response = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    return response.json();
  }
  `,
      },
    ];

    if (queryType) {
      files.push(...generateOperations(introspectionJson, queryType, 'useQuery'));
    }

    if (mutationType) {
      files.push(...generateOperations(introspectionJson, mutationType, 'useMutation'));
    }

    if (subscriptionType) {
      // React Query v3 does not have built-in support for subscriptions, but you can implement it using other libraries or custom hooks
      files.push(...generateOperations(introspectionJson, subscriptionType, 'useSubscription'));
    }

    return files;
  }

//   // Example usage
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const tsQueryFiles = generateQueryFiles(introspectionJson);
//   console.log(tsQueryFiles);
