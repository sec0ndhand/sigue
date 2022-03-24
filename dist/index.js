"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schema = exports.getMutatationObject = exports.defaultOptions = void 0;
exports.unbase64 = unbase64;

var _graphqlSequelize = require("graphql-sequelize");

var _changeCase = require("change-case");

var _graphql = require("graphql");

var _assign = _interopRequireDefault(require("lodash/assign"));

var _graphqlSubscriptions = require("graphql-subscriptions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const CLASSMETHODS = "classMethods";
const ASSOCIATE = "associate";
let modelTypes = [];
let modelNamesArray;
let models;
let authenticated;

function unbase64(i) {
  return Buffer.from(i, 'base64').toString('ascii');
}

function getId(id) {
  let [type, db_id] = unbase64(id).split(":");
  console.log(unbase64(id), db_id);
  return db_id;
}
/**
 * @property pubSub - needs to implement asyncIterator, and publish functions
 * @property
 */


const defaultOptions = {
  pubSub: {
    publish: () => {},
    asyncIterator: () => {}
  },
  authenticated: resolver => async (parent, args, context, info) => {
    return resolver(parent, args, context, info);
  }
};
exports.defaultOptions = defaultOptions;

const getAssociations = (mod, depth) => {
  const md = models[modelNamesArray.find(m => m === mod.name)]; // console.log(Object.keys(models[mod.name].options[CLASSMETHODS][ASSOCIATE]))

  if (models[mod.name] && models[mod.name].options && CLASSMETHODS in models[mod.name].options && ASSOCIATE in models[mod.name].options[CLASSMETHODS] && typeof models[mod.name].options.classMethods.getGraphQlAssociations == "function") {
    // console.log("we called it!")
    return models[mod.name].options.classMethods.getGraphQlAssociations(md, modelTypes, authenticated, _graphqlSequelize.resolver, _graphql.GraphQLList, getModelGraphQLType, models, depth);
  }

  return {};
};

const getModelGraphQLType = (md, depth, model_suffix) => {
  depth = depth + 1;
  let found = modelTypes.find(t => t.name == md.name + model_suffix);
  if (found) return found;
  let associations = {};

  if (depth < 12) {
    associations = getAssociations(md, depth);
  }

  console.log(associations, md.name);
  let fields = (0, _graphqlSequelize.attributeFields)(md, {
    globalId: true
  });
  const modType = new _graphql.GraphQLObjectType({
    name: md.name + (model_suffix ? model_suffix : ""),
    description: `Generated model for ${md.name}`,
    //fields: assign(fields)
    fields: () => _objectSpread(_objectSpread(_objectSpread({}, getAssociations(md, depth)), fields), {}, {
      _deleted_: {
        type: _graphql.GraphQLBoolean
      }
    })
  }); // console.log("before: ", modelTypes.length)
  // modelTypes = found ? modelTypes.map( m => m.name == md.name ? modType : m) : [...modelTypes, modType];

  modelTypes = [...modelTypes, modType]; // console.log("after: ", modelTypes.length)

  return modType;
};

const getMutatationObject = (mod, options) => {
  var _mod$options, _mod$options$classMet;

  options = options ? options : defaultOptions;
  const inputArgs = (0, _graphqlSequelize.attributeFields)(mod);
  let updateArgs;

  const _mod$primaryKeyAttrib = mod.primaryKeyAttributes[0],
        {
    [_mod$primaryKeyAttrib]: deleted
  } = inputArgs,
        createArgs = _objectWithoutProperties(inputArgs, [_mod$primaryKeyAttrib].map(_toPropertyKey));

  const deleteArgs = {
    [mod.primaryKeyAttributes[0]]: {
      type: _graphql.GraphQLString,
      description: `The primary_key (${mod.primaryKeyAttributes[0]}) of the ${mod.name} to delete`
    },
    id: {
      type: _graphql.GraphQLString,
      description: `The id of the ${mod.name} to delete`
    }
  }; // make other fields not required on update

  Object.keys(inputArgs).map(k => {
    let kObj = inputArgs[k]; //console.log(`${mod.name}: ${k}: ${JSON.stringify(kObj.type)}`);

    if (kObj.type.toString().endsWith("!") && k.toLowerCase().includes(mod.primaryKeyAttributes[0]) == false) {
      let obj_type = kObj.type.toString().toLowerCase();
      let type_to_assign; // console.log(obj_type);

      switch (obj_type) {
        case "int":
        case "int!":
          type_to_assign = _graphql.GraphQLInt;
          break;

        case "sequelizejson!":
        case "sequelizejson":
          type_to_assign = _graphqlSequelize.JSONType.default;
          break;

        case "float!":
        case "float":
          type_to_assign = _graphql.GraphQLFloat;
          break;

        case "bool":
        case "bool!":
        case "boolean":
        case "boolean!":
          type_to_assign = _graphql.GraphQLBoolean;
          break;

        case "string!":
        case "string":
        default:
          type_to_assign = _graphql.GraphQLString;
          break;
      }

      kObj.type = type_to_assign;
    }

    updateArgs = _objectSpread(_objectSpread({}, updateArgs), {}, {
      [k]: kObj
    });
  });
  let preMutationDefined = typeof (mod === null || mod === void 0 ? void 0 : (_mod$options = mod.options) === null || _mod$options === void 0 ? void 0 : (_mod$options$classMet = _mod$options.classMethods) === null || _mod$options$classMet === void 0 ? void 0 : _mod$options$classMet.preMutation) === "function";
  let postMutationDefined = mod && mod.options && mod.options.classMethods && typeof mod.options.classMethods.postMutation === "function";
  let pubSubIsDefined = options && options.pubsub && options.pubsub.publish && typeof options.pubsub.publish === "function";
  return {
    [(0, _changeCase.pascalCase)(`create_${mod.name}`)]: {
      type: modelTypes.find(modelT => modelT.name == mod.name),
      args: (0, _assign.default)(createArgs),
      description: `Creates a new ${mod.name}`,
      // resolve: (obj, args, context, info) => {
      //   return mod.create(args);
      // }
      resolve: options.authenticated(async (obj, args, context, info) => {
        var tmpArgs = args;
        if (preMutationDefined) tmpArgs = await mod.options.classMethods.preMutation(args, models, "create");
        console.log("tmpArgs", tmpArgs);
        let ret = await mod.create(tmpArgs);
        if (postMutationDefined) ret = await mod.options.classMethods.postMutation(ret, models, "create");

        if (pubSubIsDefined) {
          options.pubsub.publish((0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`), {
            [(0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`)]: ret.dataValues
          });
        }

        return new Promise((rsv, rej) => rsv(ret));
      })
    },
    [(0, _changeCase.pascalCase)(`update_${mod.name}`)]: {
      type: modelTypes.find(modelT => modelT.name == mod.name),
      args: (0, _assign.default)(updateArgs),
      description: `Updates an existing ${mod.name}`,
      resolve: options.authenticated(async (obj, args) => {
        // return mod.save(args, {returning: true, validate: false});
        var tmpArgs = args;
        const id = args["id"] ? getId(args["id"]) : args[mod.primaryKeyAttributes[0]];
        if (preMutationDefined) tmpArgs = await mod.options.classMethods.preMutation(args, models, "update");
        await mod.update(tmpArgs, {
          where: {
            [mod.primaryKeyAttributes[0]]: id
          }
        });
        let ret = await mod.findByPk(id); // console.log(`${(mod.name)}_changed`, {[`${titleCase(mod.name)}_changed`]: ret.dataValues});

        if (postMutationDefined) ret = await mod.options.classMethods.postMutation(ret, models, "update");

        if (pubSubIsDefined) {
          options.pubsub.publish((0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`), {
            [(0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`)]: ret.dataValues
          });
        } // console.log(ret);


        return new Promise((rsv, rej) => rsv(ret));
      })
    },
    [(0, _changeCase.pascalCase)(`delete_${mod.name}`)]: {
      type: modelTypes.find(modelT => modelT.name == mod.name),
      args: (0, _assign.default)(deleteArgs),
      description: `Deletes ${mod.name}s`,
      resolve: options.authenticated(async (obj, args, context, info) => {
        // console.log(JSON.stringify({...argsToFindOptions(args)}, null, '\t') );
        var tmpArgs = args;
        if (preMutationDefined) tmpArgs = await mod.options.classMethods.preMutation(args, models, "delete"); // console.log({tmpArgs});

        const id = args["id"] || args.where["id"] ? getId(args["id"] || args.where["id"]) : args[mod.primaryKeyAttributes[0]];
        let where = id ? {
          [mod.primaryKeyAttributes[0]]: id
        } : Object.keys(tmpArgs.where).reduce((prev, k, i) => {
          let value = tmpArgs.where[k]; // console.log(typeof value);

          return _objectSpread(_objectSpread({}, prev), {}, {
            [k]: typeof value == "function" ? value(info.variableValues) : value
          });
        }, {}); // console.log(where);

        if (pubSubIsDefined) {
          options.pubsub.publish((0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`), {
            [(0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`)]: _objectSpread({
              _deleted_: true
            }, where)
          });
        }

        let ret = await mod.destroy({
          where
        }); // console.log(ret);

        if (postMutationDefined) ret = await mod.options.classMethods.postMutation(ret, models, "delete");
        return new Promise((rsv, rej) => rsv({
          [mod.primaryKeyAttributes[0]]: id,
          _deleted_: true
        }));
      })
    }
  };
};
/**
 *
 * @param {Sequelize Model} mod
 * @returns {Object}
 */


exports.getMutatationObject = getMutatationObject;

const getSubscriptionObject = (mod, options) => {
  let pubSubIsDefined = options && options.pubsub && options.pubsub.publish && typeof options.pubsub.publish === "function";
  const defaultArgs = (0, _graphqlSequelize.defaultListArgs)(mod);
  return {
    [(0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`)]: {
      type: modelTypes.find(modelT => modelT.name == mod.name),
      args: defaultArgs,
      description: `Subscribes to ${mod.name} changes.  The delete object will return an object that represents the where clause used to delete.`,
      subscribe: (0, _graphqlSubscriptions.withFilter)(() => {
        if (pubSubIsDefined) {
          return options.pubsub.asyncIterator((0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`));
        } else return {};
      }, (payload, variables, more, more2) => {
        // if no where clause is provided, send what is already there
        if (!variables["where"]) return true;
        const rtn = whereMatch(payload[(0, _changeCase.pascalCase)(`${mod.name.toLowerCase()}_changed`)], variables["where"]);
        return rtn ? true : false;
      })
    }
  };
};

const whereMatch = (obj, where) => {
  const keys = Object.keys(where);
  let subRtn = true;
  const rtn = keys.length > 0 ? keys.reduce((prev, key, i) => {
    if (typeof where[key] === "object") {
      // console.log("call it again.", key)
      subRtn = whereMatch(obj[key], where[key]);
    } // console.log("obj[key] === where[key]", typeof obj[key] === "object", key, obj[key], where[key].toString(), obj[key] === where[key]);


    return prev && subRtn && (typeof obj[key] === "object" ? true : obj[key] === where[key]);
  }, true) : true;
  return rtn ? true : false;
};

const getGenericSchemaObjectFromModel = (md, options, modelTypes) => {
  const inputArgs = (0, _graphqlSequelize.defaultListArgs)(md);
  let found_type = modelTypes ? modelTypes.find(modelT => modelT.name == md.name + "_full") : undefined;
  found_type = found_type ? found_type : modelTypes.find(modelT => modelT.name == md.name); // console.log(JSON.stringify(found_type));

  const modObj = {
    [(0, _changeCase.pascalCase)(md.name)]: {
      type: found_type,
      //getModelGraphQLType(md, associations),
      // args will automatically be mapped to `where`
      args: {
        [md.primaryKeyAttribute]: {
          description: `${md.primaryKeyAttribute} of the ${md.name}`,
          type: _graphql.GraphQLString
        },
        id: {
          description: `The encoded version of the primary key of the ${md.name}`,
          type: _graphql.GraphQLString
        }
      },
      resolve: options.authenticated((0, _graphqlSequelize.resolver)(md, {
        dataLoader: true
      }), md)
    },
    [`${(0, _changeCase.pascalCase)(md.name)}s`]: {
      type: new _graphql.GraphQLList(found_type),
      args: _objectSpread(_objectSpread({}, inputArgs), {}, {
        offset: {
          description: `Sets how many to skip when limiting ${md.name}s.`,
          type: _graphql.GraphQLInt
        }
      }),
      resolve: options.authenticated((0, _graphqlSequelize.resolver)(md, {
        dataLoader: true
      }), md)
    }
  };
  return modObj;
};

function titleCase(str) {
  return str.toLowerCase().split(" ").map(function (word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}
/**
 * @name schema
 * @description given sequelize object, a GraphQL schema will be returned
 * @param {Array<SequelizeModel>} models
 * @param {Object} options
 * @returns {GraphQLSchema}
 */


const schema = function (modeles, options) {
  models = modeles;
  authenticated = options.authenticated;
  modelNamesArray = Object.keys(models).filter(md => md.toLowerCase() != "sequelize");
  modelNamesArray.map(modelName => getModelGraphQLType(models[modelName], 0)
  /* console.log(modelName) */
  );
  return new _graphql.GraphQLSchema({
    query: new _graphql.GraphQLObjectType({
      name: "RootQueryType",
      fields: _objectSpread({}, modelNamesArray.reduce((prev, mod, i) => {
        if (modelNamesArray.length - 1 === i) {
          console.log("last one");
        }

        return _objectSpread(_objectSpread({}, prev), getGenericSchemaObjectFromModel(models[mod], options, modelTypes));
      }, {}))
    }),
    mutation: new _graphql.GraphQLObjectType({
      name: "RootMutationType",
      fields: _objectSpread({}, modelNamesArray.reduce((prev, mod, i) => {
        return _objectSpread(_objectSpread({}, prev), getMutatationObject(models[mod], options));
      }, {}))
    }),
    subscription: new _graphql.GraphQLObjectType({
      name: "Subscription",
      fields: _objectSpread({}, modelNamesArray.reduce((prev, mod, i) => {
        return _objectSpread(_objectSpread({}, prev), getSubscriptionObject(models[mod], options));
      }, {}))
    })
  });
}; // module.exports = schema;


exports.schema = schema;