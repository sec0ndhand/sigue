function graphqlTypeToTs(type) {
  switch (type.kind) {
    case 'SCALAR':
      if (type.name === 'Int' || type.name === 'Float') return 'number';
      if (type.name === 'Boolean') return 'boolean';
      if (type.name === 'String') return 'string';
      if (type.name === 'ID') return 'string';
      return 'any';
    case 'LIST':
      return `${graphqlTypeToTs(type.ofType)}[]`;
    case 'NON_NULL':
      return graphqlTypeToTs(type.ofType);
    case 'ENUM':
    case 'OBJECT':
    case 'INTERFACE':
    case 'UNION':
      return type.name;
    default:
      return 'any';
  }
}

function generateTypeFiles(introspectionJson) {
  const { __schema } = introspectionJson;
  const { types } = __schema;

  const userDefinedTypes = types.filter(
    (type) => !type.name.startsWith('__')
  );

  const tsFiles = [];

  userDefinedTypes.forEach((type) => {
    let tsFileContent = '';

    switch (type.kind) {
      case 'SCALAR':
        break;
      case 'ENUM':
        tsFileContent += `export enum ${type.name} {\n`;
        type.enumValues.forEach((value) => {
          tsFileContent += `  ${value.name} = "${value.name}",\n`;
        });
        tsFileContent += '}\n';
        break;
      case 'OBJECT':
      case 'INTERFACE':
        tsFileContent += `export interface ${type.name} {\n`;
        type.fields.forEach((field) => {
          tsFileContent += `  ${field.name}: ${graphqlTypeToTs(field.type)};\n`;
        });
        tsFileContent += '}\n';
        break;
      case 'UNION':
        tsFileContent += `export type ${type.name} = ${type.possibleTypes.map((t) => t.name).join(' | ')};\n`;
        break;
      case 'INPUT_OBJECT':
        tsFileContent += `export interface ${type.name} {\n`;
        type.inputFields.forEach((field) => {
          tsFileContent += `  ${field.name}: ${graphqlTypeToTs(field.type)};\n`;
        });
        tsFileContent += '}\n';
        break;
      default:
        break;
    }

    if (tsFileContent) {
      tsFiles.push({
        fileName: `${type.name}.ts`,
        fileContents: tsFileContent,
      });
    }
  });

  return tsFiles;
}

exports.generateTypeFiles = generateTypeFiles;
// // Example usage:
// const introspectionJson = {
//   __schema: {
//     // Mocked introspection schema data
//     // Replace this with the actual introspection JSON
//   },
// };

// const tsTypeFiles = generateTypescriptTypeFiles(introspectionJson);

// // Here, tsTypeFiles will be an array of objects, each with a fileName and fileContents property.
// console.log(tsTypeFiles);
