import { queryAsync, getPool, initialPool } from '@kevinwang0316/mysql-helper';

import { invokeFetchPosts } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('add-user: invoke the Get / endpoint', () => {
  const userId = `test_${Date.now()}`;
  const displayName = `${userId}_testDisplayName`;

  beforeAll(async () => {
    // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    jest.setTimeout(10000);
    await initEvns();
    context = {
      dbHost: process.env['db-host'],
      dbName: process.env['db-name'],
      dbUser: process.env['db-user'],
      dbPassword: process.env['db-password'],
    };
    initialPool(context.dbHost, context.dbUser, context.dbPassword, context.dbName);
    // Prepare a user and insert posts for testing
    await queryAsync('INSERT INTO ?? (id, displayName) VALUES (?, ?)', [process.env.USERS_TABLE, userId, displayName]);
    await queryAsync('INSERT INTO ?? (id, message, userId) VALUES ("1", "message", ?)', [process.env.POSTS_TABLE, userId]);
    await queryAsync('INSERT INTO ?? (id, message, userId) VALUES ("2", "message", ?)', [process.env.POSTS_TABLE, userId]);
    await queryAsync('INSERT INTO ?? (id, message, userId) VALUES ("3", "message", ?)', [process.env.POSTS_TABLE, userId]);
  });

  test('invoke fech-posts function', async () => {
    const event = {};

    const { statusCode, body } = await invokeFetchPosts(event, context);

    expect(statusCode).toBe(200);
    // const posts = JSON.parse(body);
    expect(body.length).toBe(3);
    expect(body[0].message).toBe('message');
    expect(body[1].message).toBe('message');
    expect(body[2].message).toBe('message');
  });

  // Clear up and close all connection in the pool
  afterAll(async () => {
    await queryAsync('DELETE FROM ?? WHERE id = ?', [process.env.USERS_TABLE, userId]);
    await queryAsync('DELETE FROM ?? WHERE userId = ?', [process.env.POSTS_TABLE, userId]);
    getPool().end();
  });
});
