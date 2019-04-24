import { queryAsync, getPool, initialPool } from '@kevinwang0316/mysql-helper';

import { invokeAddPost } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('add-user: invoke the Get / endpoint', () => {
  const userId = `test_${Date.now()}_${Math.random()}`;
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
  });

  test('invoke add-post function', async () => {
    const body = { userId, message: 'test message' };
    const event = { body: JSON.stringify(body) };

    let res = await invokeAddPost(event, context);

    expect(res.statusCode).toBe(200);
    let { rows } = await queryAsync('SELECT message FROM Posts WHERE userId = ?', [userId]);
    expect(rows.length).toBe(0);

    // Prepare a user for testing
    await queryAsync('INSERT INTO ?? (id, displayName) VALUES (?, ?)', [process.env.USERS_TABLE, userId, displayName]);

    // Call the function again
    res = await invokeAddPost(event, context);
    ({ rows } = await queryAsync('SELECT message FROM Posts WHERE userId = ?', [userId]));
    expect(rows.length).toBe(1);

    // Clear up
    await queryAsync('DELETE FROM Posts WHERE userId = ?', [userId]);
    await queryAsync('DELETE FROM Users WHERE id = ?', [userId]);
  });

  // Close all connection in the pool
  afterAll(() => getPool().end());
});
