function graphqlTypeToRust(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'i32';
        if (type.name === 'Float') return 'f64';
        if (type.name === 'Boolean') return 'bool';
        if (type.name === 'String') return 'String';
        if (type.name === 'ID') return 'String';
        return 'serde_json::Value';
      case 'LIST':
        return `Vec<${graphqlTypeToRust(type.ofType)}>`;
      case 'NON_NULL':
        return graphqlTypeToRust(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'serde_json::Value';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const rustFiles = [];

    userDefinedTypes.forEach((type) => {
      let rustFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          rustFileContent += `#[derive(Debug, Serialize, Deserialize)]\n`;
          rustFileContent += `pub enum ${type.name} {\n`;
          type.enumValues.forEach((value) => {
            rustFileContent += `    ${value.name},\n`;
          });
          rustFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          rustFileContent += `#[derive(Debug, Serialize, Deserialize)]\n`;
          rustFileContent += `pub struct ${type.name} {\n`;
          type.fields.forEach((field) => {
            rustFileContent += `    pub ${field.name}: ${graphqlTypeToRust(field.type)},\n`;
          });
          rustFileContent += '}\n';
          break;
        case 'UNION':
          // Rust doesn't have a direct equivalent for GraphQL unions, so a comment is added
          rustFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          rustFileContent += `#[derive(Debug, Serialize, Deserialize)]\n`;
          rustFileContent += `pub struct ${type.name} {\n`;
          type.inputFields.forEach((field) => {
            rustFileContent += `    pub ${field.name}: ${graphqlTypeToRust(field.type)},\n`;
          });
          rustFileContent += '}\n';
          break;
        default:
          break;
      }

      if (rustFileContent) {
        rustFiles.push({
          fileName: `${type.name}.rs`,
          fileContents: rustFileContent,
        });
      }
    });

    return rustFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;
//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const rustTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, rustTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(rustTypeFiles);
