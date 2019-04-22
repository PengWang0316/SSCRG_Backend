'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { queryAsync } = require('@kevinwang0316/mysql-helper');

const wrapper = require('../middlewares/wrapper');

// Conditional insert
const QUERY_SQL = 'INSERT INTO ?? (id, displayName, avatar) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT ? FROM ?? WHERE id = ?)';

const handler = async (event, context) => {
  const { id, displayName, avatar } = JSON.parse(event.body);
  try {
    // TODO: test to remove await
    await cloudwatch.trackExecTime(
      'MySQL INSERT latency',
      () => queryAsync(
        QUERY_SQL,
        [process.env.USERS_TABLE, id, displayName, avatar, id, process.env.USERS_TABLE, id],
      ),
    );
    return { statusCode: 200 };
  } catch (err) {
    log.error(`${context.functionName}: ${err}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler);
