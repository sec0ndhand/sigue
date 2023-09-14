(function(exports) {

  // Converts string to PascalCase
  function toPascalCase(str) {
    return str
      .replace(/[\-_](\w)/g, (_, letter) => letter.toUpperCase())
      .replace(/^(\w)/, (_, letter) => letter.toUpperCase());
  }

  // Converts string to snake_case
  function toSnakeCase(str) {
    return str
      .replace(/\.?([A-Z]+)/g, (x, y) => "_" + y.toLowerCase())
      .replace(/^_/, "")
      .replace(/-/g, '_');
  }

  // Export functions
  exports.toPascalCase = toPascalCase;
  exports.toSnakeCase = toSnakeCase;

})(typeof exports === 'undefined' ? this['Converters'] = {} : exports);

// // Test (if you're running in a node environment, this will log results)
// if (typeof require !== 'undefined' && require.main === module) {
//   console.log(exports.toPascalCase("snake_case_example"));
//   console.log(exports.toPascalCase("kebob-case-example"));
//   console.log(exports.toPascalCase("camelCaseExample"));
//   console.log(exports.toPascalCase("PascalCaseExample"));

//   console.log(exports.toSnakeCase("snake_case_example"));
//   console.log(exports.toSnakeCase("kebob-case-example"));
//   console.log(exports.toSnakeCase("camelCaseExample"));
//   console.log(exports.toSnakeCase("PascalCaseExample"));
// }
