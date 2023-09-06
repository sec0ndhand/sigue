function graphqlTypeToJava(type) {
    switch (type.kind) {
      case 'SCALAR':
        if (type.name === 'Int') return 'int';
        if (type.name === 'Float') return 'float';
        if (type.name === 'Boolean') return 'boolean';
        if (type.name === 'String') return 'String';
        if (type.name === 'ID') return 'String';
        return 'Object';
      case 'LIST':
        return `List<${graphqlTypeToJava(type.ofType)}>`;
      case 'NON_NULL':
        return graphqlTypeToJava(type.ofType);
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

    const javaFiles = [];

    userDefinedTypes.forEach((type) => {
      let javaFileContent = '';

      switch (type.kind) {
        case 'SCALAR':
          break;
        case 'ENUM':
          javaFileContent += `public enum ${type.name} {\n`;
          type.enumValues.forEach((value, index, array) => {
            javaFileContent += `  ${value.name}${index < array.length - 1 ? ',' : ''}\n`;
          });
          javaFileContent += '}\n';
          break;
        case 'OBJECT':
        case 'INTERFACE':
          javaFileContent += `public class ${type.name} {\n`;
          type.fields.forEach((field) => {
            javaFileContent += `  public ${graphqlTypeToJava(field.type)} ${field.name};\n`;
          });
          javaFileContent += '}\n';
          break;
        case 'UNION':
          // Java doesn't have a direct equivalent for GraphQL unions, so a comment is added
          javaFileContent += `// Union type ${type.name}, please handle in code.\n`;
          break;
        case 'INPUT_OBJECT':
          javaFileContent += `public class ${type.name} {\n`;
          type.inputFields.forEach((field) => {
            javaFileContent += `  public ${graphqlTypeToJava(field.type)} ${field.name};\n`;
          });
          javaFileContent += '}\n';
          break;
        default:
          break;
      }

      if (javaFileContent) {
        javaFiles.push({
          fileName: `${type.name}.java`,
          fileContents: javaFileContent,
        });
      }
    });

    return javaFiles;
  }


  exports.generateTypeFiles = generateTypeFiles;

//   // Example usage:
//   const introspectionJson = {
//     __schema: {
//       // Mocked introspection schema data
//       // Replace this with the actual introspection JSON
//     },
//   };

//   const javaTypeFiles = generateJavaTypeFiles(introspectionJson);

//   // Here, javaTypeFiles will be an array of objects, each with a fileName and fileContents property.
//   console.log(javaTypeFiles);
