import aws4 from 'aws4';
import axios from 'axios';
import URL from 'url'; // Come from node.js module


const APP_ROOT = '../..';
const isIntegrationTest = process.env.TEST_MODE === 'integration'; // Pass this from npm script to decide which kind of test will be run.

// The helper to sign the request and return headers
const signHttpRequest = (isIAM, realURL) => {
  if (!isIAM) return {};
  const url = URL.parse(realURL);
  const opts = {
    host: url.hostname,
    path: url.pathname,
  };
  aws4.sign(opts);

  const headers = {
    Host: opts.headers.Host,
    'X-Amz-Date': opts.headers['X-Amz-Date'],
    Authorization: opts.headers.Authorization,
    'X-Amz-Security-Token': opts.headers['X-Amz-Security-Token'],
  };
  // If 'X-Amz-Security-Token' does not exsit, delete it for the local test.
  if (!headers['X-Amz-Security-Token']) delete headers['X-Amz-Security-Token'];
  return headers;
};

// Invode the handler via a real api gateway to do the acceptance test
const viaHttp = async (path, opts = { iam: false }, method = 'get') => new Promise(async (resolve, reject) => {
  const url = `${process.env.TEST_ROOT}/${path}`;
  console.log(`Invoking via HTTP ${url}`);
  const headers = signHttpRequest(opts.iam, url);
  // Set a Authorization header if function need a cognito user token
  if (opts.authHeader) headers.Authorization = opts.authHeader;
  const options = {
    method,
    url,
    data: opts.body,
    headers,
  };
  if (!opts.body) delete options.data;
  try {
    const result = await axios(options);
    resolve({
      headers: { ...result.headers, 'Content-Type': result.headers['content-type'] },
      body: result.data,
      statusCode: result.status,
    });
  } catch (err) {
    reject(err);
  }
});

// Invoke the handler locally to do the integration test
const viaHandler = (handlerName, event = {}, context = {}) => {
  // eslint-disable-next-line import/no-dynamic-require
  const { handler } = require(`${APP_ROOT}/functions/${handlerName}`);

  return new Promise((resolve, reject) => {
    const callback = (err, response) => {
      if (err) reject(err);
      else {
        const contentType = response.headers && response.headers['Content-Type'] ? response.headers['Content-Type'] : 'application/json';
        if (response.body && contentType === 'application/json') response.body = JSON.parse(response.body);
      }
      resolve(response);
    };
    handler(event, context, callback);
  });
};

export const invokeAddUser = (event, context) => (isIntegrationTest
  ? viaHandler('add-user', event, context)
  : viaHttp('user', { iam: false, body: JSON.parse(event.body) }, 'post'));
