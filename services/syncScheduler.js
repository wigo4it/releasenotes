const schedule = require('node-schedule');
const { synchronizeBacklogItems } = require('../services/syncService');

// Schedule the synchronization to run every hour
const startScheduler = () => {
  schedule.scheduleJob('0 * * * *', async () => {
    try {
      console.log('Running scheduled synchronization...');
      await synchronizeBacklogItems();
    } catch (error) {
      console.error('Error during scheduled synchronization:', error);
    }
  });

  console.log('Scheduler initialized. Synchronization will run every hour.');
};

module.exports = startScheduler;