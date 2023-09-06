const { generateQueryFields } = require("../../common/generateQueryFields");
function generateOperations(introspectionJson, operationType, apolloHook) {
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
  import { gql, ${apolloHook} } from '@apollo/client';

  export const ${functionName}Document = gql\`${query}\`;

  export function use${functionName.capitalize()}(variables?: any) {
    return ${apolloHook}(${functionName}Document, { variables });
  }
  `,
    });
  });

  return files;
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

function generateQueryFiles(introspectionJson) {
  const { __schema } = introspectionJson;
  const { queryType, mutationType, subscriptionType } = __schema;

  const files = [];

  if (queryType) {
    files.push(...generateOperations(introspectionJson, queryType, "useQuery"));
  }

  if (mutationType) {
    files.push(
      ...generateOperations(introspectionJson, mutationType, "useMutation")
    );
  }

  if (subscriptionType) {
    files.push(
      ...generateOperations(
        introspectionJson,
        subscriptionType,
        "useSubscription"
      )
    );
  }

  return files;
}

// // Example usage
// const introspectionJson = {
//   __schema: {
//     // Mocked introspection schema data
//     // Replace this with the actual introspection JSON
//   },
// };

// const tsQueryFiles = generateQueryFiles(introspectionJson);
// console.log(tsQueryFiles);
