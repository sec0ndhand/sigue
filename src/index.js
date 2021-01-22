import {
  resolver,
  attributeFields,
  defaultListArgs,
  JSONType,
  argsToFindOptions
} from 'graphql-sequelize';

import {
GraphQLObjectType,
GraphQLNonNull,
GraphQLList,
GraphQLSchema,
GraphQLInt,
GraphQLString,
GraphQLBoolean,
GraphQLFloat
} from 'graphql';

import assign from 'lodash/assign';
const CLASSMETHODS = 'classMethods';
const ASSOCIATE = 'associate';
import { withFilter } from 'graphql-subscriptions';

let modelTypes = [];
let modelNamesArray;
let models;
let authenticated;

/**
* @property pubSub - needs to implement asyncIterator, and publish functions
* @property
*/
export const defaultOptions = {
  pubSub: {
      publish: () => {},
      asyncIterator: () => {}
  },
  authenticated: resolver => async (parent, args, context, info) => {
      return resolver(parent, args, context, info);
  }
}


const getAssociations = (mod, depth) => {
const md = models[modelNamesArray.find(m => m === mod.name)];
// console.log(Object.keys(models[mod.name].options[CLASSMETHODS][ASSOCIATE]))
if (models[mod.name] && models[mod.name].options && CLASSMETHODS in models[mod.name].options && 
    ASSOCIATE in models[mod.name].options[CLASSMETHODS] &&
    typeof models[mod.name].options.classMethods.getGraphQlAssociations == "function") {
      // console.log("we called it!")
  return models[mod.name].options.classMethods.getGraphQlAssociations(md, modelTypes, authenticated, resolver, GraphQLList, getModelGraphQLType, models, depth);
}
return {};
}

const getModelGraphQLType = (md, depth, model_suffix) => {

depth = depth + 1;
let found = modelTypes.find(t => t.name == (md.name + model_suffix));
if (found) return found;

let associations = {};
if (depth < 12){
  associations = getAssociations(md, depth);
}
// console.log(associations);
const fields = { ...associations , ...attributeFields(md, {globalId: true}) };
const modType  = new GraphQLObjectType({
  name: md.name + (model_suffix ? model_suffix : ""),
  description: `Generated model for ${md.name}`,
  //fields: assign(fields)
  fields: () => ({
    ...getAssociations(md, depth),
    ...attributeFields(md, {globalId: true})
  })
});

// console.log("before: ", modelTypes.length)
// modelTypes = found ? modelTypes.map( m => m.name == md.name ? modType : m) : [...modelTypes, modType];
modelTypes = [...modelTypes, modType];
// console.log("after: ", modelTypes.length)

return modType;
}

export const getMutatationObject = (mod, options) => {
options = options ? options : defaultOptions;
const inputArgs = attributeFields(mod);
let updateArgs;
const {[`${mod.name.toLowerCase()}_id`]: deleted, ...createArgs } = inputArgs;

const deleteArgs = defaultListArgs(mod);
// make other fields not required on update
Object.keys(inputArgs).map(k => {
  let kObj = inputArgs[k];
  //console.log(`${mod.name}: ${k}: ${JSON.stringify(kObj.type)}`);
  if(kObj.type.toString().endsWith("!") && (k.toLowerCase().includes(`${mod.name}_id`) == false)){
    let obj_type = kObj.type.toString().toLowerCase();
    let type_to_assign;
    // console.log(obj_type);
    switch(obj_type){
      case "int" :
      case "int!" :
        type_to_assign = GraphQLInt;
        break;
      case "sequelizejson!" :
      case "sequelizejson" :
        type_to_assign = JSONType.default;
        break;
      case "float!" :
      case "float" :
        type_to_assign = GraphQLFloat;
        break;
      case "bool" :
      case "bool!" :
      case "boolean" :
      case "boolean!" :
        type_to_assign = GraphQLBoolean;
        break;
      case "string!" :
      case "string" :
      default:
        type_to_assign = GraphQLString;
        break;

    }
    kObj.type = type_to_assign;
  }
  updateArgs = {...updateArgs, [k]: kObj};
});

let preMutationDefined = mod && mod.options && mod.options.classMethods &&
  (typeof mod.options.classMethods.preMutation === "function")

let postMutationDefined = mod && mod.options && mod.options.classMethods &&
  (typeof mod.options.classMethods.postMutation === "function")

let pubSubIsDefined = options && options.pubsub && options.pubsub.publish &&
  (typeof options.pubsub.publish === "function")

return {
  [`create${titleCase(mod.name)}`]: {
    type: modelTypes.find(modelT => modelT.name == mod.name),
    args: assign(createArgs),
    description: `Creates a new ${mod.name}`,
    // resolve: (obj, args, context, info) => {
    //   return mod.create(args);
    // }
    resolve: options.authenticated(async (obj, args, context, info) => {
      var tmpArgs = args;
      
      if(preMutationDefined) tmpArgs = await mod.options.classMethods.preMutation(args, models, "create");
      console.log("tmpArgs", tmpArgs)
      let ret = await mod.create(tmpArgs);
      if(postMutationDefined) ret = await mod.options.classMethods.postMutation(ret, models, "create");
      if (pubSubIsDefined){
          options.pubsub.publish(`${mod.name.toLowerCase()}_changed`, {[`${mod.name.toLowerCase()}_changed`]:ret.dataValues});
      }
      return new Promise((rsv, rej) => rsv(ret) );

    })
  },
  [`update${titleCase(mod.name)}`]: {
    type: modelTypes.find(modelT => modelT.name == mod.name),
    args: assign(updateArgs),
    description: `Updates an existing ${mod.name}`,
    resolve: options.authenticated(async (obj, args) => {
      // return mod.save(args, {returning: true, validate: false});
      var tmpArgs = args;
      if(preMutationDefined) tmpArgs = await mod.options.classMethods.preMutation(args, models, "update");
      await mod.update(tmpArgs, { where: {[`${mod.name.toLowerCase()}_id`]: args[`${mod.name.toLowerCase()}_id`]}});
      
      let ret = await mod.findById(args[`${mod.name.toLowerCase()}_id`]);
      // console.log(`${titleCase(mod.name)}_changed`, {[`${titleCase(mod.name)}_changed`]: ret.dataValues});

      if(postMutationDefined) ret = await mod.options.classMethods.postMutation(ret, models, "update");

      if (pubSubIsDefined){
          options.pubsub.publish(`${mod.name.toLowerCase()}_changed`, {[`${mod.name.toLowerCase()}_changed`]:ret.dataValues});
      }
      // console.log(ret);
      return new Promise((rsv, rej) => rsv(ret) );
    })
  },
  [`delete${titleCase(mod.name)}`]: {
    type: modelTypes.find(modelT => modelT.name == mod.name),
    args: assign(deleteArgs),
    description: `Deletes an amount of ${mod.name}s`,
    resolve: options.authenticated(async (obj, args, context, info) => {
      // console.log(JSON.stringify({...argsToFindOptions(args)}, null, '\t') );
      var tmpArgs = args;
      if(preMutationDefined) tmpArgs = await mod.options.classMethods.preMutation(args, models, "delete");
      let where = Object.keys(tmpArgs.where).reduce((prev, k, i) => {
        let value = tmpArgs.where[k];
        // console.log(typeof value);
        return {...prev, [k]: typeof value == 'function' ? value(info.variableValues) : value }          
      }, {})
      // console.log(where);

      if (pubSubIsDefined){
          options.pubsub.publish(`${mod.name.toLowerCase()}_changed`, {[`${mod.name.toLowerCase()}_changed`]:obj});
      }
      let ret = await mod.destroy({where})
      console.log(ret)
      if(postMutationDefined) ret = await mod.options.classMethods.postMutation(ret, models, "delete");
      return new Promise((rsv, rej) => rsv({[`${mod.name.toLowerCase()}_id`]: tmpArgs.where[`${mod.name.toLowerCase()}_id`]}) );
    })
  },
}
}

/**
*  
* @param {Sequelize Model} mod 
* @returns {Object}
*/

const getSubscriptionObject = (mod, options) => {
let pubSubIsDefined = options && options.pubsub && options.pubsub.publish &&
  (typeof options.pubsub.publish === "function")

const defaultArgs = defaultListArgs(mod);
return {
    [`${mod.name.toLowerCase()}_changed`]: {
      type: modelTypes.find(modelT => modelT.name == mod.name),
      args: defaultArgs,
      description: `Subscribes to ${mod.name} changes.  The delete object will return an object that represents the where clause used to delete.`,
      subscribe: withFilter(
        () => { if(pubSubIsDefined) { return options.pubsub.asyncIterator(`${mod.name.toLowerCase()}_changed`) } else return {} },
        (payload, variables, more, more2) => {
          // if no where clause is provided, send what is already there
          if(!variables["where"]) return true;
          const rtn = whereMatch(payload[`${mod.name.toLowerCase()}_changed`], variables["where"]);
          return rtn ? true : false
        },
      )       
    }
};
}

const whereMatch = (obj, where) => {
const keys = Object.keys(where);
let subRtn = true;
const rtn = keys.length > 0 ? 
  keys.reduce(
    (prev, key, i) => { 
      if(typeof where[key] === "object"){
        // console.log("call it again.", key)
        subRtn = (whereMatch(obj[key], where[key] ));
      }
      // console.log("obj[key] === where[key]", typeof obj[key] === "object", key, obj[key], where[key].toString(), obj[key] === where[key]);
      return ( prev && subRtn && 
        (typeof obj[key] === "object" ? true : obj[key] === where[key] )
      ); 
    }, true
  ) 
: true;
// console.log("rtn, obj[key], obj, where: ",
//           rtn ? true : false,
//           obj[keys[0]],
//           obj,
//           where
//         );
return rtn ? true : false;
}




// const getSubscriptionObject = (mod, options) => {
//   return {
//       [`${mod.name.toLowerCase()}_changed`]: {
//         type: modelTypes.find(modelT => modelT.name == mod.name),
//         description: `Subscribes to ${mod.name} changes.  
//         The delete object will return an object that 
//         represents the where clause used to delete.`,
//         subscribe: () => options.pubsub.asyncIterator(`${mod.name.toLowerCase()}_changed`)        
//       }
//   };
// }







const getGenericSchemaObjectFromModel = (md, options, modelTypes) => {
// console.log(`schemaGenerators start, ${md.name}:`, JSON.stringify(Object.keys(md.sequelize.models.document.tableAttributes.shipto.references), null, '\t'))
// console.log("", modelTypes);
// const associations = {};
//const inputArgs = attributeFields(md);
const inputArgs = defaultListArgs(md);
let found_type = modelTypes ? modelTypes.find(modelT => modelT.name == (md.name + "_full")) : undefined;
found_type = found_type ? found_type : modelTypes.find(modelT => modelT.name == md.name);
// console.log(JSON.stringify(found_type));
const modObj = {
    [md.name]: {
    type: found_type , //getModelGraphQLType(md, associations),
    // args will automatically be mapped to `where`
    args: {
      [md.primaryKeyAttribute]: {
        description: `${md.primaryKeyAttribute} of the ${md.name}`,
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve: options.authenticated(resolver(md, {dataLoader: true}), md)
  },
  [`${md.name}s`]: {
    type: new GraphQLList(found_type),
    args: {...inputArgs,
      offset: {
        description: `Sets how many to skip when limiting ${md.name}s.`,
        type: GraphQLInt
      }
    },
    resolve: options.authenticated(resolver(md, {dataLoader: true}), md)
  }
}
return modObj;
}


function titleCase(str) {
return str.toLowerCase().split(' ').map(function(word) {
  return (word.charAt(0).toUpperCase() + word.slice(1));
}).join(' ');
}



/**
* @name schema
* @description given sequelize object, a GraphQL schema will be returned
* @param {Array<SequelizeModel>} models 
* @param {Object} options 
* @returns {GraphQLSchema}
*/
export const schema = function(modeles, options) {
  models = modeles;
  authenticated = options.authenticated;
  modelNamesArray = Object.keys(models).filter(md => md.toLowerCase() != "sequelize");
  modelNamesArray.map(modelName => getModelGraphQLType(models[modelName], 0)/* console.log(modelName) */);
  return new GraphQLSchema({
  query: new GraphQLObjectType({
      name: 'RootQueryType',
      fields: 
      {
      ...modelNamesArray.reduce((prev, mod, i) => {
          if (modelNamesArray.length - 1 === i) { console.log("last one") }
          return {...prev, ...getGenericSchemaObjectFromModel(models[mod], options, modelTypes) }
      }, {})//,
      // Field for searching for a user by name
      //documentSearch: documentSearch()
      }
  }),
  mutation: new GraphQLObjectType({
      name: 'RootMutationType',
      fields: 
      {
      ...modelNamesArray.reduce((prev, mod, i) => {
          return {...prev, 
          ...getMutatationObject(models[mod], options)
          }
      }, {})
      }
  }),
  subscription: new GraphQLObjectType({
      name: 'Subscription',
      fields:
      {
      ...modelNamesArray.reduce((prev, mod, i) => {
          return {...prev, 
          ...getSubscriptionObject(models[mod], options)
          }
      }, {})
      }
  })
  });
}

// module.exports = schema;
