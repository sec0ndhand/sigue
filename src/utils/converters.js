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
      .replace(/[\-_]+/g, "_") // Handle multiple underscores/hyphens
      .replace(/^_/, "");
  }

  // Converts string to kebob-case
  function toKebobCase(str) {
    return str
      .replace(/\.?([A-Z]+)/g, (x, y) => "-" + y.toLowerCase())
      .replace(/[\-_]+/g, "-") // Handle multiple underscores/hyphens
      .replace(/^-/, "");
  }

  // Converts string to camelCase
  function toCamelCase(str) {
    return str
      .replace(/[\-_](\w)/g, (_, letter) => letter.toUpperCase())
      .replace(/^(\w)/, (_, letter) => letter.toLowerCase());
  }

  // Converts string to Title Case
  function toTitleCase(str) {
    return str
      .toLowerCase()
      .split(" ")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  // Export functions
  exports.toPascalCase = toPascalCase;
  exports.toSnakeCase = toSnakeCase;
  exports.toKebobCase = toKebobCase;
  exports.toCamelCase = toCamelCase;
  exports.toTitleCase = toTitleCase;

})(typeof exports === 'undefined' ? this['Converters'] = {} : exports);

// Test (if you're running in a node environment, this will log results)
if (typeof require !== 'undefined' && require.main === module && process.env.NODE_ENV === 'test' ) {
  console.log("============================= PascalCase =============================");
  console.log(exports.toPascalCase("user"));
  console.log(exports.toPascalCase("WrongCase_Example1"));
  console.log(exports.toPascalCase("Wrong_case_Example2"));
  console.log(exports.toPascalCase("snake_case_example"));
  console.log(exports.toPascalCase("kebob-case-example"));
  console.log(exports.toPascalCase("camelCaseExample"));
  console.log(exports.toPascalCase("PascalCaseExample"));

  console.log("\n============================ snake_case ============================");
  console.log(exports.toSnakeCase("user"));
  console.log(exports.toSnakeCase("WrongCase_Example1"));
  console.log(exports.toSnakeCase("Wrong_case_Example2"));
  console.log(exports.toSnakeCase("snake_case_example"));
  console.log(exports.toSnakeCase("kebob-case-example"));
  console.log(exports.toSnakeCase("camelCaseExample"));
  console.log(exports.toSnakeCase("PascalCaseExample"));

  console.log("\n============================ kebob-case ============================");
  console.log(exports.toKebobCase("user"));
  console.log(exports.toKebobCase("WrongCase_Example1"));
  console.log(exports.toKebobCase("Wrong_case_Example2"));
  console.log(exports.toKebobCase("snake_case_example"));
  console.log(exports.toKebobCase("kebob-case-example"));
  console.log(exports.toKebobCase("camelCaseExample"));
  console.log(exports.toKebobCase("PascalCaseExample"));

  console.log("\n============================ camelCase =============================");
  console.log(exports.toCamelCase("user"));
  console.log(exports.toCamelCase("WrongCase_Example1"));
  console.log(exports.toCamelCase("Wrong_case_Example2"));
  console.log(exports.toCamelCase("snake_case_example"));
  console.log(exports.toCamelCase("kebob-case-example"));
  console.log(exports.toCamelCase("camelCaseExample"));
  console.log(exports.toCamelCase("PascalCaseExample"));
}
