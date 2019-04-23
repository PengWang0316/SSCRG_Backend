import { queryAsync, getPool, initialPool } from '@kevinwang0316/mysql-helper';

import { invokeAddUser } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('add-user: invoke the Get / endpoint', () => {
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

  test('invoke add-user function', async () => {
    const id = `test_${Date.now()}`;
    const displayName = `${id}_testDisplayName`;
    const body = { id, displayName, avatar: 'avatar url' };
    const event = { body: JSON.stringify(body) };

    let res = await invokeAddUser(event, context);

    expect(res.statusCode).toBe(200);
    let { rows } = await queryAsync('SELECT id FROM Users WHERE id = ?', [id]);
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(id);

    // Call the function again to make sure the same use will not be inserted twice.
    res = await invokeAddUser(event, context);
    ({ rows } = await queryAsync('SELECT id FROM Users WHERE displayName = ?', [displayName]));
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(id);

    // Clear up
    await queryAsync('DELETE FROM Users WHERE id = ?', [id]);
  });

  // Close all connection in the pool
  afterAll(() => getPool().end());
});
