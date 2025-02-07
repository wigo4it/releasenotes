const { synchronizeBacklogItems } = require('../services/syncService');
const azureDevOpsService = require('../services/azureDevOpsService');

jest.mock('../services/azureDevOpsService');

describe('SyncService', () => {
  test('should call AzureDevOpsService to fetch backlog items', async () => {
    azureDevOpsService.fetchBacklogItems.mockResolvedValue([{ id: 1, title: 'Test Item' }]);

    await synchronizeBacklogItems();

    expect(azureDevOpsService.fetchBacklogItems).toHaveBeenCalledTimes(1);
  });
});