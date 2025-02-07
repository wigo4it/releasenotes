const azureDevOpsService = require('./azureDevOpsService');
const { retryWithDelay } = require('../db/sync'); // Import the retry helper function

/**
 * Batch size for database inserts or updates
 */
const BATCH_SIZE = 50;

/**
 * Synchronize backlog items with the database
 */
const synchronizeBacklogItems = async () => {
  try {
    console.log('Starting synchronization process...');

    const backlogItems = await azureDevOpsService.fetchBacklogItems();

    console.log(`Fetched ${backlogItems.length} backlog items. Starting processing...`);

    // Process backlog items in batches
    for (let i = 0; i < backlogItems.length; i += BATCH_SIZE) {
      const batch = backlogItems.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);

      await Promise.all(
        batch.map(async (item) => {
          try {
              Item.upsert({
                id: item.id,
                title: item.title,
                areaPath: item.areaPath,
                workItemType: item.workItemType,
                gemeente: item.gemeente,
                servicepack: item.servicepack,
                releaseId: item.releaseId,
                userStory: item.userStory,
                acceptatiecriteria: item.acceptatiecriteria,
                stuurdatawijzigingen: item.stuurdatawijzigingen,
                batchwijzigingen: item.batchwijzigingen,
                aandachtspunten: item.aandachtspunten,
              });
          } catch (error) {
            console.error(`Failed to process item with ID ${item.id}:`, error);
          }
        })
      );
    }

    console.log(`${backlogItems.length} backlog items processed and synchronized successfully.`);
  } catch (error) {
    console.error('Error during synchronization:', error);
    throw error;
  }
};

module.exports = { synchronizeBacklogItems };