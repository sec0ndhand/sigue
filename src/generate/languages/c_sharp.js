function graphqlTypeToCSharp(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'int';
        if (type.name === 'Float') return 'float';
        if (type.name === 'Boolean') return 'bool';
        if (type.name === 'String') return 'string';
        if (type.name === 'ID') return 'string';
        return 'object';
      case 'LIST':
        return `List<${graphqlTypeToCSharp(type.ofType)}>`;
      case 'NON_NULL':
        return graphqlTypeToCSharp(type.ofType);
      case 'ENUM':
      case 'OBJECT':
      case 'INTERFACE':
      case 'UNION':
        return type.name;
      default:
        return 'object';
    }
  }

  function generateTypeFiles(introspectionJson) {
    const { __schema } = introspectionJson;
    const { types } = __schema;

    const userDefinedTypes = types.filter(
      (type) => !type.name.startsWith('__')
    );

    const csharpFiles = [];

    userDefinedTypes.forEach((type) => {
      let csharpFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          csharpFileContent += `public enum ${type.name} {\n`;
          type.enumValues.forEach((value, index, array) => {
            csharpFileContent += `  ${value.name}${index < array.length - 1 ? ',' : ''}\n`;
          });
          csharpFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          csharpFileContent += `public class ${type.name} {\n`;
          type.fields.forEach((field) => {
            csharpFileContent += `  public ${graphqlTypeToCSharp(field.type)} ${field.name} { get; set; }\n`;
          });
          csharpFileContent += '}\n';
          break;
        case 'UNION':
          // C# doesn't have a direct equivalent for GraphQL unions, so a comment is added
          csharpFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          csharpFileContent += `public class ${type.name} {\n`;
          type.inputFields.forEach((field) => {
            csharpFileContent += `  public ${graphqlTypeToCSharp(field.type)} ${field.name} { get; set; }\n`;
          });
          csharpFileContent += '}\n';
          break;
        default:
          break;
      }

      if (csharpFileContent) {
        csharpFiles.push({
          fileName: `${type.name}.cs`,
          fileContents: csharpFileContent,
        });
      }
    });

    return csharpFiles;
  }

  exports.generateTypeFiles = generateTypeFiles;

//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const csharpTypeFiles = generateTypeFiles(introspectionJson);

//   // Here, csharpTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(csharpTypeFiles);
