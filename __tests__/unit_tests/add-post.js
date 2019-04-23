import { error } from '@kevinwang0316/log';
import { trackExecTime } from '@kevinwang0316/cloudwatch';
import { queryAsync } from '@kevinwang0316/mysql-helper';

import { handler } from '../../functions/add-post';

require('../helpers/initailEnvsForUnitTest');

jest.mock('@kevinwang0316/mysql-helper', () => ({
  queryAsync: jest.fn(),
}));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

const QUERY_SQL = 'INSERT INTO ?? (message, userId) SELECT ?, ? WHERE EXISTS (SELECT id FROM ?? WHERE id = ?) ';

describe('add-post', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('add-post without error', async () => {
    const body = { userId: 'userId', message: 'message' };
    const event = { body: JSON.stringify(body) };
    const context = { functionName: 'functionName' };

    const result = await handler(event, context);

    expect(trackExecTime).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenLastCalledWith(
      QUERY_SQL,
      [
        process.env.POSTS_TABLE, body.message, body.userId,
        process.env.USERS_TABLE, body.userId,
      ],
    );
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200 });
  });

  test('add-post with database error', async () => {
    const body = { userId: 'userId', message: 'message' };
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
