function graphqlTypeToSwift(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'Int';
        if (type.name === 'Float') return 'Float';
        if (type.name === 'Boolean') return 'Bool';
        if (type.name === 'String') return 'String';
        if (type.name === 'ID') return 'String';
        return 'Any';
      case 'LIST':
        return `[${graphqlTypeToSwift(type.ofType)}]`;
      case 'NON_NULL':
        return graphqlTypeToSwift(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'Any';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const swiftFiles = [];

    userDefinedTypes.forEach((type) => {
      let swiftFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          swiftFileContent += `enum ${type.name}: String, Codable {\n`;
          type.enumValues.forEach((value) => {
            swiftFileContent += `    case ${value.name}\n`;
          });
          swiftFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          swiftFileContent += `struct ${type.name}: Codable {\n`;
          type.fields.forEach((field) => {
            swiftFileContent += `    let ${field.name}: ${graphqlTypeToSwift(field.type)}\n`;
          });
          swiftFileContent += '}\n';
          break;
        case 'UNION':
          // Swift doesn't have a direct equivalent for GraphQL unions, so a comment is added
          swiftFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          swiftFileContent += `struct ${type.name}: Codable {\n`;
          type.inputFields.forEach((field) => {
            swiftFileContent += `    let ${field.name}: ${graphqlTypeToSwift(field.type)}\n`;
          });
          swiftFileContent += '}\n';
          break;
        default:
          break;
      }

      if (swiftFileContent) {
        swiftFiles.push({
          fileName: `${type.name}.swift`,
          fileContents: swiftFileContent,
        });
      }
    });

    return swiftFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;
//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const swiftTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, swiftTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(swiftTypeFiles);
