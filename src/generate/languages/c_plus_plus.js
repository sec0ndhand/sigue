function graphqlTypeToCpp(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'int';
        if (type.name === 'Float') return 'float';
        if (type.name === 'Boolean') return 'bool';
        if (type.name === 'String') return 'std::string';
        if (type.name === 'ID') return 'std::string';
        return 'std::any';
      case 'LIST':
        return `std::vector<${graphqlTypeToCpp(type.ofType)}>`;
      case 'NON_NULL':
        return graphqlTypeToCpp(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'std::any';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const cppFiles = [];

    userDefinedTypes.forEach((type) => {
      let cppFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          cppFileContent += `enum class ${type.name} {\n`;
          type.enumValues.forEach((value, index, array) => {
            cppFileContent += `  ${value.name}${index < array.length - 1 ? ',' : ''}\n`;
          });
          cppFileContent += '};\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          cppFileContent += `struct ${type.name} {\n`;
          type.fields.forEach((field) => {
            cppFileContent += `  ${graphqlTypeToCpp(field.type)} ${field.name};\n`;
          });
          cppFileContent += '};\n';
          break;
        case 'UNION':
          // C++ doesn't have a direct equivalent for GraphQL unions, so a comment is added
          cppFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          cppFileContent += `struct ${type.name} {\n`;
          type.inputFields.forEach((field) => {
            cppFileContent += `  ${graphqlTypeToCpp(field.type)} ${field.name};\n`;
          });
          cppFileContent += '};\n';
          break;
        default:
          break;
      }

      if (cppFileContent) {
        cppFiles.push({
          fileName: `${type.name}.h`,
          fileContents: cppFileContent,
        });
      }
    });

    return cppFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;

//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const cppTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, cppTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(cppTypeFiles);
