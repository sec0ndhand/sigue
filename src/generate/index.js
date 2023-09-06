#! /usr/bin/env node

console.log("Generating files...");
const path = require("path");
const fs = require('fs');
const { outputFiles } = require("./common/outputFiles");
const { getIntrospection } = require("./introspect/getIntrospection");

// print out the help message
const printHelp = () => {
  console.log("Usage: sigue [outputPath] [language] [endpoint]");
  console.log(
    "  outputPath: The directory where the generated files will be saved"
  );
  console.log(
    "  language: The language of the generated files. Supported languages: dart, typescript, react-query"
  );
  console.log(
    "  endpoint: The GraphQL endpoint to use for the react-query hooks"
  );
};

if (process.argv.length < 3) {
  printHelp();
  process.exit(1);
}

// Read commmand line arguments to determine which files to generate
const args = process.argv.slice(2);
const outputPath = args[0] || "./src/models";
const language = args[1] || "typescript";
const endpoint = args[2] || "http://localhost:4000/graphql";

async function main() {
  const introspection = await getIntrospection(endpoint);

  // Generate the model files
  const filePath = path.join(__dirname, "languages", `${language}.js`);
  if (fs.existsSync(filePath)) {
    var { generateTypeFiles } = require(filePath);
    const excludeTypes = ["RootQueryType", "RootMutationType", "RootSubscriptionType"];
    const filesToOutput = generateTypeFiles(introspection).filter(fileObj => excludeTypes.includes(fileObj.fileName.split(".")[0]) === false);
    outputFiles(filesToOutput, outputPath);
  } else {
    console.log(`File does not exist: ${filePath}`);
    return null;
  }
}

main();
