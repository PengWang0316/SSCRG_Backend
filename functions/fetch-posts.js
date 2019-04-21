'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { queryAsync } = require('@kevinwang0316/mysql-helper');

const wrapper = require('../middlewares/wrapper');

const QUERY_SQL = 'SELECT p.message, p.timestamp, u.displayName FROM ?? AS p INNER JOIN ?? AS u ON p.userId = u.id ORDER BY p.timestamp DESC';

const handler = async (event, context) => {
  try {
    const { rows } = await cloudwatch.trackExecTime(
      'MySQL query latency',
      () => queryAsync(QUERY_SQL, [process.env.POSTS_TABLE, process.env.USERS_TABLE]),
    );
    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (err) {
    log.error(`${context.functionName}: ${err}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler);
