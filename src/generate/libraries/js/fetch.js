const { generateQueryFields } = require("../../generateQueryFields");

function generateOperations(introspectionJson, operationType) {
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
    const query = `${operationType.kind.toLowerCase()} ${queryName} {\n${
      field.name
    } {\n${returnFields}\n}\n}`;

    files.push({
      fileName: `${field.name}.ts`,
      fileContents: `
  import { graphQL } from './graphQL';

  export const ${functionName}Query = \`${query}\`;

  export async function ${functionName}(variables?: any) {
    return graphQL(${functionName}Query, variables);
  }
  `,
    });
  });

  return files;
}

function generateQueryFiles(introspectionJson) {
  const { __schema } = introspectionJson;
  const { queryType, mutationType, subscriptionType } = __schema;

  const files = [
    {
      fileName: "graphQL.ts",
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
    files.push(...generateOperations(introspectionJson, queryType));
  }

  if (mutationType) {
    files.push(...generateOperations(introspectionJson, mutationType));
  }

  if (subscriptionType) {
    files.push(...generateOperations(introspectionJson, subscriptionType));
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
