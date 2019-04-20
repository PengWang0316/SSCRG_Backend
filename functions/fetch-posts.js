'use strict';

const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { queryAsync } = require('@kevinwang0316/mysql-helper');

const wrapper = require('../middlewares/wrapper');

const handler = async (event, context) => {
  const { id } = event.queryStringParameters;
  try {
    const { rows } = await cloudwatch.trackExecTime(
      'MySQL query latency',
      () => queryAsync('SELECT * FROM posts WHERE userId = ?', [id]),
    );
    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (err) {
    log.error(`${context.functionName}: ${err}`);
    return { statusCode: 500 };
  }
};

module.exports.handler = wrapper(handler);
