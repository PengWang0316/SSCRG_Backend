'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { queryAsync } = require('@kevinwang0316/mysql-helper');

const wrapper = require('../middlewares/wrapper');

const QUERY_SQL = 'INSERT INTO ?? (message, userId) SELECT ?, ? WHERE EXISTS (SELECT id FROM ?? WHERE id = ?) ';

const handler = async (event, context) => {
  const { message, userId } = JSON.parse(event.body);
  try {
    await cloudwatch.trackExecTime(
      'MySQL query latency',
      () => queryAsync(QUERY_SQL, [
        process.env.POSTS_TABLE, message, userId, process.env.USERS_TABLE, userId,
      ]),
    );
    return { statusCode: 200 };
  } catch (err) {
    log.error(`${context.functionName}: ${err}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler);
