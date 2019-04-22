import { error } from '@kevinwang0316/log';
import { trackExecTime } from '@kevinwang0316/cloudwatch';
import { queryAsync } from '@kevinwang0316/mysql-helper';

import { handler } from '../../functions/add-user';

require('../helpers/initailEnvsForUnitTest');

jest.mock('@kevinwang0316/mysql-helper', () => ({
  queryAsync: jest.fn(),
}));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

const QUERY_SQL = 'INSERT INTO ?? (id, displayName, avatar) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT ? FROM ?? WHERE id = ?)';

describe('add-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('add-user without error', async () => {
    const body = { id: 'id', displayName: 'displayName', avatar: 'avatar' };
    const event = { body: JSON.stringify(body) };
    const context = { functionName: 'functionName' };

    const result = await handler(event, context);

    expect(trackExecTime).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenLastCalledWith(
      QUERY_SQL,
      [
        process.env.USERS_TABLE, body.id, body.displayName,
        body.avatar, body.id, process.env.USERS_TABLE, body.id,
      ],
    );
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200 });
  });

  test('add-user with database error', async () => {
    const body = { id: 'id', displayName: 'displayName', avatar: 'avatar' };
    const event = { body: JSON.stringify(body) };
    const context = { functionName: 'functionName' };
    const err = new Error('error message');
    trackExecTime.mockRejectedValueOnce(err);

    const result = await handler(event, context);

    expect(trackExecTime).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenLastCalledWith(`${context.functionName}: ${err}`);
    expect(result).toEqual({ statusCode: 500 });
  });
});
