function graphqlTypeToDart(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'int';
        if (type.name === 'Float') return 'double';
        if (type.name === 'Boolean') return 'bool';
        if (type.name === 'String') return 'String';
        if (type.name === 'ID') return 'String';
        return 'dynamic';
      case 'LIST':
        return 'List<${graphqlTypeToDart(type.ofType)}>';
      case 'NON_NULL':
        return graphqlTypeToDart(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'dynamic';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const dartFiles = [];

    userDefinedTypes.forEach((type) => {
      let dartFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          dartFileContent += `enum ${type.name} {\n`;
          type.enumValues.forEach((value) => {
            dartFileContent += `  ${value.name},\n`;
          });
          dartFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          dartFileContent += `class ${type.name} {\n`;
          type.fields.forEach((field) => {
            dartFileContent += `  final ${graphqlTypeToDart(field.type)} ${field.name};\n`;
          });
          dartFileContent += '}\n';
          break;
        case 'UNION':
          dartFileContent += `typedef ${type.name} = ${type.possibleTypes.map((t) => t.name).join(' | ')};\n`;
          break;
        case 'INPUT_OBJECT':
          dartFileContent += `class ${type.name} {\n`;
          type.inputFields.forEach((field) => {
            dartFileContent += `  final ${graphqlTypeToDart(field.type)} ${field.name};\n`;
          });
          dartFileContent += '}\n';
          break;
        default:
          break;
      }

      if (dartFileContent) {
        dartFiles.push({
          fileName: `${type.name}.dart`,
          fileContents: dartFileContent,
        });
      }
    });

    return dartFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;

//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const dartTypeFiles = generateDartTypeFiles(introspectionJson);

//   // Here, dartTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(dartTypeFiles);
