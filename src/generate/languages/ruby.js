function graphqlTypeToRuby(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'Integer';
        if (type.name === 'Float') return 'Float';
        if (type.name === 'Boolean') return 'Boolean';
        if (type.name === 'String') return 'String';
        if (type.name === 'ID') return 'String';
        return 'Object';
      case 'LIST':
        return 'Array';
      case 'NON_NULL':
        return graphqlTypeToRuby(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'Object';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const rubyFiles = [];

    userDefinedTypes.forEach((type) => {
      let rubyFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          rubyFileContent += `module ${type.name}\n`;
          type.enumValues.forEach((value) => {
            rubyFileContent += `  ${value.name} = '${value.name}'.freeze\n`;
          });
          rubyFileContent += "end\n";
          break;
        case 'OBJECT':
        case 'INTERFACE':
          rubyFileContent += `class ${type.name}\n`;
          type.fields.forEach((field) => {
            rubyFileContent += `  attr_accessor :${field.name} # Type: ${graphqlTypeToRuby(field.type)}\n`;
          });
          rubyFileContent += "end\n";
          break;
        case 'UNION':
          // Ruby doesn't have a direct equivalent for GraphQL unions, so a comment is added
          rubyFileContent += `# Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          rubyFileContent += `class ${type.name}\n`;
          type.inputFields.forEach((field) => {
            rubyFileContent += `  attr_accessor :${field.name} # Type: ${graphqlTypeToRuby(field.type)}\n`;
          });
          rubyFileContent += "end\n";
          break;
        default:
          break;
      }

      if (rubyFileContent) {
        rubyFiles.push({
          fileName: `${type.name}.rb`,
          fileContents: rubyFileContent,
        });
      }
    });

    return rubyFiles;
  }
  exports.generateTypeFiles = generateTypeFiles;

//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const rubyTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, rubyTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(rubyTypeFiles);
