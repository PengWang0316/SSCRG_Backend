import { error } from '@kevinwang0316/log';
import { trackExecTime } from '@kevinwang0316/cloudwatch';
import { queryAsync } from '@kevinwang0316/mysql-helper';

import { handler } from '../../functions/fetch-posts';

require('../helpers/initailEnvsForUnitTest');

jest.mock('@kevinwang0316/mysql-helper', () => ({
  queryAsync: jest.fn().mockReturnValue({ rows: [{ id: 1 }, { id: 2 }] }),
}));
jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

const QUERY_SQL = 'SELECT p.message, p.timestamp, u.displayName FROM ?? AS p INNER JOIN ?? AS u ON p.userId = u.id ORDER BY p.timestamp DESC';

describe('fetch-posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetch-posts without error', async () => {
    const event = {};
    const context = { functionName: 'functionName' };

    const result = await handler(event, context);

    expect(trackExecTime).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenCalledTimes(1);
    expect(queryAsync).toHaveBeenLastCalledWith(
      QUERY_SQL,
      [process.env.POSTS_TABLE, process.env.USERS_TABLE],
    );
    expect(error).not.toHaveBeenCalled();
    expect(result).toEqual({ statusCode: 200, body: JSON.stringify([{ id: 1 }, { id: 2 }]) });
  });

  test('fetch-posts with database error', async () => {
    const event = {};
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
