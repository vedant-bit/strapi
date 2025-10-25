'use strict';

const register = require('./register');
const bootstrap = require('./bootstrap');
const destroy = require('./destroy');
const contentTypes = require('./content-types');
const services = require('./services');
const controllers = require('./controllers');
const routes = require('./routes');
const config = require('./config');

module.exports = () => ({
  register,
  bootstrap,
  destroy,
  config,
  contentTypes,
  services,
  controllers,
  routes,
});