'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');

const wrapper = require('../middlewares/wrapper');

const handler = async (event, context) => {
  
};

module.exports.handler = wrapper(handler);
