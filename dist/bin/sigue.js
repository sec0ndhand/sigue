#!/usr/bin/env node
"use strict";

var _changeCase = require("change-case");

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _introspectionQuery = require("./introspectionQuery.mjs");

var _url = require("url");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _filename = (0, _url.fileURLToPath)(import.meta.url);

const _dirname = _path.default.dirname(_filename);

const arg = process.argv[2] || process.argv[1];
const foundGraphQLurl = process.argv.indexOf('--url');
const graphQLurl = foundGraphQLurl !== -1 ? process.argv[foundGraphQLurl + 1] : "http://localhost:4000/graphql";
const foundOutPutLocation = process.argv.indexOf('--folder');
const folder = foundOutPutLocation !== -1 ? process.argv[foundOutPutLocation + 1] : `./${arg}`;
console.log(`Creating ${arg} components`);

switch (arg) {
  case "urql":
    urql();
    break;

  default:
    console.log(`${arg} is not a valid argument`);
}

function graphqlGetFields(type) {
  return type.fields.map(f => `      ${f.name}`).join("\n");
}

function safeType(type) {
  return type === null ? 'String' : type;
}

function graphqlUpdateMutationsArgs(type) {
  return type.fields.filter(f => !["id", "_deleted_"].includes(f.name)).map(f => `$${f.name}: ${safeType(f.type.name) + (`${type.name}_id` === f.name ? "!" : "")}`).join(", ");
}

function graphqlCreateMutationsArgs(type) {
  return type.fields.filter(f => !["id", "_deleted_", `${type.name}_id`].includes(f.name)).map(f => `$${f.name}: ${safeType(f.type.name)}`).join(", ");
}

function graphqlArgsUpdate(type) {
  return type.fields.filter(f => !["id", "_deleted_"].includes(f.name)).map(f => `${f.name}: $${f.name}`).join(", ");
}

function graphqlArgsCreate(type) {
  return type.fields.filter(f => !["id", "_deleted_", `${type.name}_id`].includes(f.name)).map(f => `${f.name}: $${f.name}`).join(", ");
}

function getJsDoc(type) {
  return `/**
 * @typedef {Object} ${(0, _changeCase.pascalCase)(type.name)} - generated type
${type.fields.map(f => ` * @property {${safeType(f.type.name)}} ${f.name} - a ${safeType(f.type.name)} property of ${f.name}`).join("\n")}
 */`;
}

function schema() {
  return (0, _nodeFetch.default)(graphQLurl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: _introspectionQuery.introspectionQuery
    })
  }).then(res => res.json()).then(res => res).catch(err => console.log(err));
}

async function urql() {
  const EXCLUDED_TYPES = ['__Schema', '__Type', '__TypeKind', '__Field', '__InputValue', '__EnumValue', '__Directive', '__DirectiveLocation', 'RootMutationType', 'Subscription', 'RootQueryType', 'RootSubscriptionType'];
  const s = await schema();

  const types = s.data.__schema.types.filter(t => ['OBJECT'].includes(t.kind) && EXCLUDED_TYPES.indexOf(t.name) === -1);

  const template = _fs.default.readFileSync(_path.default.resolve(_dirname + "/../../templates/urql.template.js"), "utf8");

  let indexFile = '';
  let CacheExchange = '';
  let CacheExchangeSubscription = '';
  types.forEach(type => {
    const name = (0, _changeCase.pascalCase)(type.name);
    const fields = graphqlGetFields(type);
    const createMutationsArgs = graphqlCreateMutationsArgs(type);
    const updateMutationArgs = graphqlUpdateMutationsArgs(type);
    const createArgs = graphqlArgsCreate(type);
    const updateArgs = graphqlArgsUpdate(type);
    const jsDoc = getJsDoc(type);
    const result = template.replace(/\$\{CamelClass\}/g, name).replace(/\$\{fields\}/g, fields).replace(/\$\{createMutationsArgs\}/g, createMutationsArgs).replace(/\$\{updateMutationsArgs\}/g, updateMutationArgs).replace(/\$\{createArgs\}/g, createArgs).replace(/\$\{updateArgs\}/g, updateArgs).replace(/\$\{jsDoc\}/g, jsDoc);

    if (!_fs.default.existsSync(folder)) {
      _fs.default.mkdirSync(folder);
    } else {
      if (_fs.default.existsSync(folder + "/" + name + "s.js")) {
        _fs.default.unlinkSync(folder + "/" + name + "s.js");
      }
    }

    _fs.default.writeFileSync(`${folder}/${name}s.js`, result);

    indexFile += `export * as ${name}s from './${name}s';\n`;
    CacheExchange += `import { ${name}Updaters } from "./${name}s";\n`;
    CacheExchangeSubscription += `        ...${name}Updaters,\n`;
  });

  if (!_fs.default.existsSync(folder)) {
    _fs.default.mkdirSync(folder);
  } else {
    _fs.default.writeFileSync(`${folder}/index.js`, indexFile);

    _fs.default.writeFileSync(`${folder}/CacheExchange.js`, `${CacheExchange}
export const CacheExchange = {
    updates: {
        Subscription: {
${CacheExchangeSubscription}
        },
    },
};`);
  }

  console.log(`Finished creating ${process.argv[2]} components\n`);
}