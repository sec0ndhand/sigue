function graphqlTypeToGo(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'int';
        if (type.name === 'Float') return 'float64';
        if (type.name === 'Boolean') return 'bool';
        if (type.name === 'String') return 'string';
        if (type.name === 'ID') return 'string';
        return 'interface{}';
      case 'LIST':
        return `[]${graphqlTypeToGo(type.ofType)}`;
      case 'NON_NULL':
        return graphqlTypeToGo(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'interface{}';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const goFiles = [];

    userDefinedTypes.forEach((type) => {
      let goFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          goFileContent += `type ${type.name} string\n\nconst (\n`;
          type.enumValues.forEach((value) => {
            goFileContent += `  ${type.name}${value.name} ${type.name} = "${value.name}"\n`;
          });
          goFileContent += ')\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          goFileContent += `type ${type.name} struct {\n`;
          type.fields.forEach((field) => {
            goFileContent += `  ${capitalize(field.name)} ${graphqlTypeToGo(field.type)} \`json:"${field.name}"\`\n`;
          });
          goFileContent += '}\n';
          break;
        case 'UNION':
          // Go doesn't have a direct equivalent for GraphQL unions, so a comment is added
          goFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          goFileContent += `type ${type.name} struct {\n`;
          type.inputFields.forEach((field) => {
            goFileContent += `  ${capitalize(field.name)} ${graphqlTypeToGo(field.type)} \`json:"${field.name}"\`\n`;
          });
          goFileContent += '}\n';
          break;
        default:
          break;
      }

      if (goFileContent) {
        goFiles.push({
          fileName: `${type.name}.go`,
          fileContents: goFileContent,
        });
      }
    });

    return goFiles;
  }

  function capitalize(s) {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }


  exports.generateTypeFiles = generateTypeFiles;

//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const goTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, goTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(goTypeFiles);
