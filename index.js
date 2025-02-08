const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { sequelize } = require('./db/init'); // Import Sequelize instance
const releaseRoutes = require('./controllers/releases');
const { fetchBacklogItems } = require('./services/azureDevOpsService');
const { transformHtml, urlify } = require('./utils/sanitizeHtml'); // Correct import path

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Pass the helper functions to the EJS template
app.locals.transformHtml = transformHtml;
app.locals.urlify = urlify;

// Use the release routes
app.use('/', releaseRoutes);

// Function to synchronize the database and start the server
const initializeApp = async () => {
  try {
    console.log('Starting application initialization...');

    console.log(`Attempting to start on PORT: ${PORT}`);

    console.log('Synchronizing database...');
    // await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');

    console.log('Fetching backlog items from Azure DevOps...');
    // await fetchBacklogItems();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
    });

    console.log('Application initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize the application:', error);
    process.exit(1); // Exit with an error code
  }
};

// Process-level error handling
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Initialize the application
initializeApp();