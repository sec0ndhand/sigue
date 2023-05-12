const {
  resolver,
  attributeFields,
  defaultListArgs,
  JSONType,
} = require("graphql-sequelize");

const { pascalCase, snakecase } = require("change-case");

const {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
  GraphQLFloat,
} = require("graphql");

const CLASSMETHODS = "classMethods";
const ASSOCIATE = "associate";
const { withFilter } = require("graphql-subscriptions");

let modelTypes = {};
const findModel = (name) => modelTypes[name];
let modelNamesArray;
let models;
let authenticated;

function unbase64(i) {
  return new Buffer(i, "base64").toString("ascii");
}

const btoa = (text) => {
  const buffer = Buffer.from(text, 'binary');
  return buffer.toString('base64');
};

const atob = (base64) => {
  if (typeof base64 === 'number') return `type:${base64}`;
  if (typeof base64 !== 'string') throw new TypeError('Expected String');
  const buffer = Buffer.from(base64, 'base64');
  return buffer.toString('binary');
};

function getId(id) {
  let [type, db_id] = atob(id).split(":");
  // console.log({ type, db_id, unbased: atob(id) });
  return db_id;
}

/**
 * @property pubsub - needs to implement asyncIterator, and publish functions
 * @property
 */
const defaultOptions = {
  pubsub: {
    publish: () => {},
    asyncIterator: () => {},
  },
  authenticated: (resolver) => async (parent, args, context, info) => {
    return resolver(parent, args, context, info);
  },
};

const getAssociations = (mod, depth) => {
  if (depth == 3) return {};

  const md = models[modelNamesArray.find((m) => m === mod.name)];
  // console.log(Object.keys(models[mod.name].options[CLASSMETHODS][ASSOCIATE]))
  const associationFoundInClassMethods =
    models[mod.name] &&
    models[mod.name].options &&
    CLASSMETHODS in models[mod.name].options &&
    ASSOCIATE in models[mod.name].options[CLASSMETHODS] &&
    typeof models[mod.name].options.classMethods.getGraphQlAssociations ==
      "function";
  if (associationFoundInClassMethods) {
    // console.log("we called it!")
    return models[mod.name].options.classMethods.getGraphQlAssociations(
      md,
      modelTypes,
      authenticated,
      resolver,
      GraphQLList,
      getModelGraphQLType,
      models,
      depth
    );
  }

  const associationFromSequelize = models[mod.name] &&
  models[mod.name].associations &&
  Object.keys(models[mod.name].associations).length > 0
  if (
    associationFromSequelize
  ) {
    return Object.keys(models[mod.name].associations).reduce((prev, k, i) => {
      let assoc = models[mod.name].associations[k];
      let target = assoc.target;
      let type = assoc.associationType;
      // console.log({modName: mod.name, type, assoc });
      if (type === undefined) return prev;
      let targetName = target.name;
      let targetType = target.options.name.singular;
      let targetGraphQLType = getModelGraphQLType(target, depth);

      // check if association type is one to many
      if (type == "HasMany") {
        targetGraphQLType = getModelGraphQLListType(target, depth);
      } else if(type == "BelongsToMany") {
      } else if(type == "BelongsTo") {
      } else if(type == "HasOne") {
      }
      // console.log({modName: mod.name, type, assoc, associationType: targetGraphQLType, type: type.name});
      return {
        ...prev,
        [k]: {
          type: targetGraphQLType,
          resolve: resolver(assoc, { dataLoader: true }),
        },
      };
    }, {});
  }
  return {};
};

const getModelGraphQLListType = (md, depth) => {
  depth = depth + 1;
  const plural = md.name + "s";
  let found = findModel(plural);
  if (found) return found;
  // console.log("getModelGraphQLListType", md.name, depth, found?.name);
  let singular = findModel(md.name);
  const modType = new GraphQLList(singular || getModelGraphQLType(md, depth));
  modelTypes[plural] = modType;
  return modType;
};

const getModelGraphQLType = (md, depth, model_suffix = "") => {
  depth = depth + 1;
  let found = findModel(md.name + model_suffix);
  if (found) return found;
  // console.log("getModelGraphQLType", md.name, depth, found?.name, modelTypes);

  let associations = {};
  if (depth < 2) {
    associations = getAssociations(md, depth);
  }
  // console.log(associations, md.name);
  let fields = attributeFields(md, { globalId: true });
  const modType = new GraphQLObjectType({
    name: md.name + (model_suffix ? model_suffix : ""),
    description: `Generated model for ${md.name}`,
    //fields: Object.assign(fields)
    fields: () => ({
      ...getAssociations(md, depth),
      ...fields,
      _deleted_: { type: GraphQLBoolean },
    }),
  });

  modelTypes[md.name] = modType;

  return modType;
};

const getMutatationObject = (mod, options = defaultOptions) => {
  const inputArgs = attributeFields(mod);
  let updateArgs;
  const { [mod.primaryKeyAttributes[0]]: deleted, ...createArgs } = inputArgs;

  const deleteArgs = defaultListArgs(mod);
  // make other fields not required on update
  Object.keys(inputArgs).map((k) => {
    let kObj = inputArgs[k];
    //console.log(`${mod.name}: ${k}: ${JSON.stringify(kObj.type)}`);
    if (
      kObj.type.toString().endsWith("!") &&
      k.toLowerCase().includes(mod.primaryKeyAttributes[0]) == false
    ) {
      let obj_type = kObj.type.toString().toLowerCase();
      let type_to_assign;
      // console.log(obj_type);
      switch (obj_type) {
        case "int":
        case "int!":
          type_to_assign = GraphQLInt;
          break;
        case "sequelizejson!":
        case "sequelizejson":
          type_to_assign = JSONType.default;
          break;
        case "float!":
        case "float":
          type_to_assign = GraphQLFloat;
          break;
        case "bool":
        case "bool!":
        case "boolean":
        case "boolean!":
          type_to_assign = GraphQLBoolean;
          break;
        case "string!":
        case "string":
        default:
          type_to_assign = GraphQLString;
          break;
      }
      kObj.type = type_to_assign;
    }
    updateArgs = { ...updateArgs, [k]: kObj };
  });

  let preMutationDefined =
    mod?.options?.classMethods &&
    typeof mod.options.classMethods.preMutation === "function";

  let postMutationDefined =
    mod &&
    mod.options &&
    mod.options.classMethods &&
    typeof mod.options.classMethods.postMutation === "function";

  let pubsubIsDefined =
    options &&
    options.pubsub &&
    options.pubsub.publish &&
    typeof options.pubsub.publish === "function";

  return {
    [pascalCase(`create_${mod.name}`)]: {
      type: findModel(mod.name),
      args: Object.assign(createArgs),
      description: `Creates a new ${mod.name}`,
      // resolve: (obj, args, context, info) => {
      //   return mod.create(args);
      // }
      resolve: options.authenticated(async (obj, args, context, info) => {
        var tmpArgs = args;

        if (preMutationDefined)
          tmpArgs = await mod.options.classMethods.preMutation(
            args,
            models,
            "create"
          );
        // console.log("tmpArgs", tmpArgs);
        let ret = await mod.create(tmpArgs);
        if (postMutationDefined)
          ret = await mod.options.classMethods.postMutation(
            ret,
            models,
            "create"
          );
        if (pubsubIsDefined) {
          options.pubsub.publish(
            snakecase(`${mod.name.toLowerCase()}_changed`),
            {
              [snakecase(`${mod.name.toLowerCase()}_changed`)]: ret.dataValues,
            }
          );
        }
        return new Promise((rsv, rej) => rsv(ret));
      }),
    },
    [snakecase(`update_${mod.name}`)]: {
      type: findModel(mod.name),
      args: Object.assign(updateArgs),
      description: `Updates an existing ${mod.name}`,
      resolve: options.authenticated(async (obj, args) => {
        // return mod.save(args, {returning: true, validate: false});
        var tmpArgs = args;
        const id = typeof args["id"] === "string"
          ? getId(args["id"])
          : args[mod.primaryKeyAttributes[0]];
        if (preMutationDefined)
          tmpArgs = await mod.options.classMethods.preMutation(
            args,
            models,
            "update"
          );
        await mod.update(tmpArgs, {
          where: {
            [mod.primaryKeyAttributes[0]]: id,
          },
        });

        let ret = await mod.findByPk(id);
        // console.log(`${(mod.name)}_changed`, {[`${titleCase(mod.name)}_changed`]: ret.dataValues});

        if (postMutationDefined)
          ret = await mod.options.classMethods.postMutation(
            ret,
            models,
            "update"
          );

        if (pubsubIsDefined) {
          options.pubsub.publish(
            snakecase(`${mod.name.toLowerCase()}_changed`),
            {
              [snakecase(`${mod.name.toLowerCase()}_changed`)]: ret.dataValues,
            }
          );
        }
        // console.log(ret);
        return new Promise((rsv, rej) => rsv(ret));
      }),
    },
    [snakecase(`delete_${mod.name}`)]: {
      type: findModel(mod.name),
      args: Object.assign(deleteArgs),
      description: `Deletes ${mod.name}s`,
      resolve: options.authenticated(async (obj, args, context, info) => {
        // console.log(JSON.stringify({...argsToFindOptions(args)}, null, '\t') );
        var tmpArgs = args;
        if (preMutationDefined)
          tmpArgs = await mod.options.classMethods.preMutation(
            args,
            models,
            "delete"
          );
        const id = typeof args.where["id"] === "string"
          ? getId(args.where["id"])
          : args[mod.primaryKeyAttributes[0]];
        let where = id
          ? { [mod.primaryKeyAttributes[0]]: id }
          : Object.keys(tmpArgs.where).reduce((prev, k, i) => {
              let value = tmpArgs.where[k];
              // console.log(typeof value);
              return {
                ...prev,
                [k]:
                  typeof value == "function"
                    ? value(info.variableValues)
                    : value,
              };
            }, {});
        // console.log(where);

        if (pubsubIsDefined) {
          options.pubsub.publish(
            snakecase(`${mod.name.toLowerCase()}_changed`),
            {
              [snakecase(`${mod.name.toLowerCase()}_changed`)]: {
                _deleted_: true,
                ...where,
              },
            }
          );
        }
        let ret = await mod.destroy({ where });
        // console.log(ret);
        if (postMutationDefined)
          ret = await mod.options.classMethods.postMutation(
            ret,
            models,
            "delete"
          );
        return new Promise((rsv, rej) =>
          rsv({
            [mod.primaryKeyAttributes[0]]: id,
          })
        );
      }),
    },
  };
};

/**
 *
 * @param {Sequelize Model} mod
 * @returns {Object}
 */

const getSubscriptionObject = (mod, options = defaultOptions) => {
  let pubsubIsDefined =
    options &&
    options.pubsub &&
    options.pubsub.publish &&
    typeof options.pubsub.publish === "function";

  console.log({pubsubIsDefined});

  const defaultArgs = defaultListArgs(mod);
  return {
    [snakecase(`${mod.name.toLowerCase()}_changed`)]: {
      type: findModel(mod.name),
      args: defaultArgs,
      description: `Subscribes to ${mod.name} changes.  The delete object will return an object that represents the where clause used to delete.`,
      subscribe: withFilter(
        () => {
          if (pubsubIsDefined) {
            return options.pubsub.asyncIterator(
              snakecase(`${mod.name.toLowerCase()}_changed`)
            );
          } else return {};
        },
        (payload, variables, more, more2) => {
          // if no where clause is provided, send what is already there
          if (!variables["where"]) return true;
          const rtn = whereMatch(
            payload[snakecase(`${mod.name.toLowerCase()}_changed`)],
            variables["where"]
          );
          return rtn ? true : false;
        }
      ),
    },
  };
};

const whereMatch = (obj, where) => {
  const keys = Object.keys(where);
  let subRtn = true;
  const rtn =
    keys.length > 0
      ? keys.reduce((prev, key, i) => {
          if (typeof where[key] === "object") {
            // console.log("call it again.", key)
            subRtn = whereMatch(obj[key], where[key]);
          }
          // console.log("obj[key] === where[key]", typeof obj[key] === "object", key, obj[key], where[key].toString(), obj[key] === where[key]);
          return (
            prev &&
            subRtn &&
            (typeof obj[key] === "object" ? true : obj[key] === where[key])
          );
        }, true)
      : true;
  return !!rtn;
};

const getGenericSchemaObjectFromModel = (md, options, modelTypes) => {
  const inputArgs = defaultListArgs(md);
  let found_type = findModel(md.name + "_full");
  found_type = findModel(md.name);
  const modObj = {
    [snakecase(md.name)]: {
      type: found_type, //getModelGraphQLType(md, associations),
      // args will automatically be mapped to `where`
      args: {
        [md.primaryKeyAttribute]: {
          description: `${md.primaryKeyAttribute} of the ${md.name}`,
          type: GraphQLString,
        },
        id: {
          description: `The encoded version of the primary key of the ${md.name}`,
          type: GraphQLString,
        },
      },
      resolve: options.authenticated(resolver(md, { dataLoader: true }), md),
    },
    [`${snakecase(md.name)}s`]: {
      type: new GraphQLList(found_type),
      args: {
        ...inputArgs,
        offset: {
          description: `Sets how many to skip when limiting ${md.name}s.`,
          type: GraphQLInt,
        },
      },
      resolve: options.authenticated(resolver(md, { dataLoader: true }), md),
    },
  };
  return modObj;
};

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * @name schema
 * @description given sequelize object, a GraphQL schema will be returned
 * @param {Array<SequelizeModel>} models
 * @param {Object} options
 * @returns {GraphQLSchema}
 */
const schema = function (modeles, options = defaultOptions) {
  models = modeles;
  authenticated = options.authenticated;
  modelNamesArray = Object.keys(models).filter(
    (md) => md.toLowerCase() != "sequelize"
  );
  modelNamesArray.map(
    (modelName) =>
      getModelGraphQLType(models[modelName], 0) /* console.log(modelName) */
  );
  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "RootQueryType",
      fields: {
        ...modelNamesArray.reduce((prev, mod, i) => {
          if (modelNamesArray.length - 1 === i) {
            // console.log("last one");
          }
          return {
            ...prev,
            ...getGenericSchemaObjectFromModel(
              models[mod],
              options,
              modelTypes
            ),
          };
        }, {}), //,
        // Field for searching for a user by name
        //documentSearch: documentSearch()
      },
    }),
    mutation: new GraphQLObjectType({
      name: "RootMutationType",
      fields: {
        ...modelNamesArray.reduce((prev, mod, i) => {
          return { ...prev, ...getMutatationObject(models[mod], options = defaultOptions) };
        }, {}),
      },
    }),
    subscription: new GraphQLObjectType({
      name: "Subscription",
      fields: {
        ...modelNamesArray.reduce((prev, mod, i) => {
          return { ...prev, ...getSubscriptionObject(models[mod], options = defaultOptions) };
        }, {}),
      },
    }),
  });
};

module.exports = { schema, defaultOptions };
