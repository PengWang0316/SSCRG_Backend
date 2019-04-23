'use strict';

/*
 * A middleware to wrap some comman middlwares.
 * So all function will have these middlewares automatically.
 */
const middy = require('middy');
const {
  functionShield, ssm, doNotWaitForEmptyEventLoop,
} = require('middy/middlewares');

const { STAGE } = process.env;

const { sampleLogging } = require('@kevinwang0316/lambda-middlewares');
const { initialMysqlPool } = require('@kevinwang0316/lambda-middlewares/mysql');
// const functionShield = require('./function-shield');

module.exports = func => middy(func)
  // .use(cors({
  //   origin: 'https://kairoscope.resonancepath.com',
  //   credentials: true,
  // }))
  .use(ssm({
    cache: true,
    cacheExpiryInMillis: 3 * 60 * 1000,
    // Save the parameters to context instead of env.
    // The parameters will just live in memory for the security concern.
    setToContext: true,
    names: {
      dbHost: `/sscrg/${STAGE}/db-host`,
      dbUser: `/sscrg/${STAGE}/db-user`,
      dbPassword: `/sscrg/${STAGE}/db-password`,
      dbName: `/sscrg/${STAGE}/db-name`,
      FUNCTION_SHIELD_TOKEN: `/sscrg/${STAGE}/function_shield_token`,
    },
  }))
  .use(sampleLogging())
  .use(functionShield({
    policy: {
      outbound_connectivity: 'block',
      read_write_tmp: 'block',
      create_child_process: 'block',
      read_handler: 'block',
    },
  }))
  .use(doNotWaitForEmptyEventLoop())
  .use(initialMysqlPool);
