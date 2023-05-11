"use strict";
const m = require('./src');

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.schema = exports.defaultOptions = void 0;
exports.getModels = exports.defaultOptions = void 0;

exports.defaultOptions = m.defaultOptions;
exports.schema = m.schema;
exports.getModels = m.getModels;
exports.sequelize = require('sequelize');
exports.graphql = require('graphql');
// module.exports = m.schema;
