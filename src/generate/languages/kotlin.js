function graphqlTypeToKotlin(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'Int';
        if (type.name === 'Float') return 'Float';
        if (type.name === 'Boolean') return 'Boolean';
        if (type.name === 'String') return 'String';
        if (type.name === 'ID') return 'String';
        return 'Any';
      case 'LIST':
        return `List<${graphqlTypeToKotlin(type.ofType)}>`;
      case 'NON_NULL':
        return graphqlTypeToKotlin(type.ofType);
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

    const kotlinFiles = [];

    userDefinedTypes.forEach((type) => {
      let kotlinFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          kotlinFileContent += `enum class ${type.name} {\n`;
          type.enumValues.forEach((value, index, array) => {
            kotlinFileContent += `  ${value.name}${index < array.length - 1 ? ',' : ''}\n`;
          });
          kotlinFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          kotlinFileContent += `data class ${type.name} (\n`;
          type.fields.forEach((field, index, array) => {
            kotlinFileContent += `  val ${field.name}: ${graphqlTypeToKotlin(field.type)}${index < array.length - 1 ? ',' : ''}\n`;
          });
          kotlinFileContent += ')\n';
          break;
        case 'UNION':
          // Kotlin doesn't have a direct equivalent for GraphQL unions, so a comment is added
          kotlinFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          kotlinFileContent += `data class ${type.name} (\n`;
          type.inputFields.forEach((field, index, array) => {
            kotlinFileContent += `  val ${field.name}: ${graphqlTypeToKotlin(field.type)}${index < array.length - 1 ? ',' : ''}\n`;
          });
          kotlinFileContent += ')\n';
          break;
        default:
          break;
      }

      if (kotlinFileContent) {
        kotlinFiles.push({
          fileName: `${type.name}.kt`,
          fileContents: kotlinFileContent,
        });
      }
    });

    return kotlinFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;
//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const kotlinTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, kotlinTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(kotlinTypeFiles);
