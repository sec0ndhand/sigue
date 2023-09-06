const fs = require('fs');
const path = require('path');

/**
 * Writes files to a specified directory and creates an index.ts that exports functions from each file.
 * @param {Array<Object>} filesArray - An array of objects containing fileName and fileContents properties.
 * @param {string} folderPath - The path of the directory where the files will be written.
 */
async function outputFiles(filesArray, folderPath) {
  // Create folder if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Initialize the contents of the index.ts file
  let indexTsContents = '';

  // Loop through the array and write each file
  for (const fileObj of filesArray) {
    const { fileName, fileContents } = fileObj;

    // Write the file
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, fileContents);

    // Add an export statement to the index.ts file contents
    const baseFileName = path.basename(fileName, path.extname(fileName)); // Remove extension
    indexTsContents += `export * from './${baseFileName}';\n`;
  }

  // Write the index.ts file
  const indexPath = path.join(folderPath, 'index.ts');
  fs.writeFileSync(indexPath, indexTsContents);
}

exports.outputFiles = outputFiles;

// // Sample usage
// const filesArray = [
//   {
//     fileName: 'graphQL.ts',
//     fileContents: `
// export async function graphQL(query: string, variables?: any) {
//   const response = await fetch('/graphql', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//     body: JSON.stringify({
//       query,
//       variables
//     })
//   });
//   return response.json();
// }
// `,
//   },
// ];

// writeFilesAndCreateIndex(filesArray, './myFolder')
//   .then(() => {
//     console.log('Files and index.ts have been created.');
//   })
//   .catch((err) => {
//     console.error('An error occurred:', err);
//   });
