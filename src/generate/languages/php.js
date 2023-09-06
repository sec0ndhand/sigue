function graphqlTypeToPHP(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'int';
        if (type.name === 'Float') return 'float';
        if (type.name === 'Boolean') return 'bool';
        if (type.name === 'String') return 'string';
        if (type.name === 'ID') return 'string';
        return 'mixed';
      case 'LIST':
        return 'array';
      case 'NON_NULL':
        return graphqlTypeToPHP(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return `\\${type.name}`;
      default:
        return 'mixed';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const phpFiles = [];

    userDefinedTypes.forEach((type) => {
      let phpFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          phpFileContent += `<?php\n\n`;
          phpFileContent += `abstract class ${type.name} {\n`;
          type.enumValues.forEach((value) => {
            phpFileContent += `  const ${value.name} = '${value.name}';\n`;
          });
          phpFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          phpFileContent += `<?php\n\n`;
          phpFileContent += `class ${type.name} {\n`;
          type.fields.forEach((field) => {
            phpFileContent += `  /** @var ${graphqlTypeToPHP(field.type)} */\n`;
            phpFileContent += `  public $${field.name};\n`;
          });
          phpFileContent += '}\n';
          break;
        case 'UNION':
          // PHP doesn't have a direct equivalent for GraphQL unions, so a comment is added
          phpFileContent += `<?php\n\n`;
          phpFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          phpFileContent += `<?php\n\n`;
          phpFileContent += `class ${type.name} {\n`;
          type.inputFields.forEach((field) => {
            phpFileContent += `  /** @var ${graphqlTypeToPHP(field.type)} */\n`;
            phpFileContent += `  public $${field.name};\n`;
          });
          phpFileContent += '}\n';
          break;
        default:
          break;
      }

      if (phpFileContent) {
        phpFiles.push({
          fileName: `${type.name}.php`,
          fileContents: phpFileContent,
        });
      }
    });

    return phpFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;
//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const phpTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, phpTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(phpTypeFiles);
