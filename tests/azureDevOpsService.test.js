const { fetchBacklogItems } = require('../services/azureDevOpsService');

describe('Azure DevOps API Integration', () => {
  test('should fetch backlog items updated within the last 30 days with a non-empty release', async () => {
    const backlogItems = await fetchBacklogItems();

    expect(Array.isArray(backlogItems)).toBe(true);

    if (backlogItems.length > 0) {
      const item = backlogItems[0];

      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('areaPath');
      expect(item).toHaveProperty('workItemType');
      expect(item).toHaveProperty('changedDate');
      expect(item).toHaveProperty('release');
    }
  });
});