const axios = require('axios');
const dotenv = require('dotenv');
const Joi = require('joi');
const winston = require('winston');
const axiosRetry = require('axios-retry').default;
const { processReleases } = require('./releaseService');
const { Item, Relation } = require('../db/associations');
const sequelize = require('../db/sequelize');

dotenv.config();

// Validate environment variables
const validateEnv = () => {
  const schema = Joi.object({
    AZURE_ORG: Joi.string().required(),
    AZURE_PROJECT: Joi.string().required(),
    AZURE_API_URL: Joi.string().uri().required(),
    AZURE_PERSONAL_ACCESS_TOKEN: Joi.string().required(),
  }).unknown();

  const { error } = schema.validate(process.env);
  if (error) throw new Error(`Config validation error: ${error.message}`);
};

validateEnv();

// Extract environment variables
const {
  AZURE_ORG,
  AZURE_PROJECT,
  AZURE_API_URL,
  AZURE_PERSONAL_ACCESS_TOKEN,
} = process.env;

// Configure axios with retries
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount, error) => {
    if (error.response?.status === 429 && error.response.headers['retry-after']) {
      return parseInt(error.response.headers['retry-after'], 10) * 1000;
    }
    return retryCount * 1000;
  },
});

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Helper to create Authorization Header
const authHeader = {
  Authorization: `Basic ${Buffer.from(`:${AZURE_PERSONAL_ACCESS_TOKEN}`).toString('base64')}`,
};

// Helper to chunk arrays into smaller pieces
const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Generate WIQL query
const generateWiqlQuery = (startDate) => `
  SELECT
    [System.WorkItemType],
    [System.ChangedDate],
    [Custom.Release]
  FROM workitems
  WHERE
    [System.WorkItemType] IN ('Bug', 'Product Backlog Item')
    AND [System.State] <> 'Closed'
    AND [System.ChangedDate] >= '${startDate}'
    AND [Custom.Release] <> ''
  ORDER BY [System.ChangedDate] DESC
`;

// Fetch backlog items
const fetchBacklogItems = async () => {
  try {
    const wiqlUrl = `${AZURE_API_URL}/${AZURE_ORG}/${AZURE_PROJECT}/_apis/wit/wiql?api-version=7.0`;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const formattedDate = thirtyDaysAgo.toISOString().split('T')[0];

    const query = generateWiqlQuery(formattedDate);

    const wiqlResponse = await axios.post(
      wiqlUrl,
      { query },
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    const workItemIds = wiqlResponse.data.workItems.map((item) => item.id);

    if (workItemIds.length === 0) {
      logger.info('No work items found.');
      return [];
    }

    const fetchWorkItemDetails = async (ids) => {
      const chunks = chunkArray(ids, 10);
      const results = [];
      for (const chunk of chunks) {
        const batchResults = await Promise.all(
          chunk.map((id) =>
            axios.get(`${AZURE_API_URL}/${AZURE_ORG}/${AZURE_PROJECT}/_apis/wit/workitems/${id}?api-version=7.0&$expand=Relations`, {
              headers: authHeader,
            })
          )
        );
        results.push(...batchResults.map((res) => res.data));
      }
      return results;
    };

    const detailedItems = await fetchWorkItemDetails(workItemIds);

    // Step 1: Process releases and map items to releaseId
    const itemsWithReleases = await processReleases(
      detailedItems.map((item) => {
        const fullAreaPath = item.fields['System.AreaPath'];
        const teamName = fullAreaPath.split('\\').pop(); // Extract the last part after '\'
    
        return {
          id: item.id,
          title: item.fields['System.Title'],
          areaPath: teamName, // Save only the team name
          workItemType: item.fields['System.WorkItemType'],
          servicepack: item.fields['Custom.Servicepack'],
          userStory: item.fields['Custom.UserStory'],
          acceptatiecriteria: item.fields['Custom.Acceptatiecriteria'],
          stuurdatawijzigingen: item.fields['Custom.Stuurdatawijzigingen'],
          batchwijzigingen: item.fields['Custom.BatchwijzigingenofBatchparameterwijzigingen'],
          aandachtspunten: item.fields['Custom.Aandachtspuntentesten'],
          release: item.fields['Custom.Release'], // Pass raw release name
          gemeente: item.fields['dSZW.Socrates.Gemeente'],
          relatedRelations: item.relations
            ?.filter((relation) => relation.rel === 'System.LinkTypes.Related')
            .map((relation) => ({
              relatedId: relation.url.split('/').pop(),
              attributes: relation.attributes,
            })),
        };
      })
    );

    // Step 2: Save items and their relations sequentially to avoid concurrency issues
    for (const newItem of itemsWithReleases) {
      if (!newItem.releaseId) {
        logger.warn(`Skipping item with null releaseId: ${newItem.id}`);
        continue;
      }
    
      await sequelize.transaction(async (transaction) => {
        const existingItem = await Item.findByPk(newItem.id, { transaction });
    
        if (existingItem) {
          await existingItem.update(newItem, { transaction });
        } else {
          await Item.create(newItem, { transaction });
        }
    
        if (newItem.relatedRelations) {
          for (const { relatedId, attributes } of newItem.relatedRelations) {
            try {
              // Fetch detailed work item for the relation
              const relatedWorkItemUrl = `${AZURE_API_URL}/${AZURE_ORG}/${AZURE_PROJECT}/_apis/wit/workitems/${relatedId}?api-version=7.0`;
              const { data: relatedWorkItem } = await axios.get(relatedWorkItemUrl, {
                headers: authHeader,
              });
    
              // Filter by work item type
              const workItemType = relatedWorkItem.fields['System.WorkItemType'];
              if (!['Bevinding', 'Ticket', 'Wijzigingsverzoek'].includes(workItemType)) {
                logger.info(`Skipping relation ${relatedId} with type ${workItemType}`);
                continue;
              }
    
              // Extract numerical part from Custom.Freshticketnummer
              const freshTicketNumber = relatedWorkItem.fields['Custom.Freshticketnummer'];
              const freshid = freshTicketNumber ? freshTicketNumber.match(/\d+/)?.[0] : null;
    
              // Prepare relation data
              const relationData = {
                id: relatedId,
                title: relatedWorkItem.fields['System.Title'],
                freshid, // Save the extracted number here
                type: workItemType,
                itemId: newItem.id,
              };
    
              // Check for existing relation
              const existingRelation = await Relation.findOne({
                where: { id: relatedId, itemId: newItem.id },
                transaction,
              });
    
              if (existingRelation) {
                await existingRelation.update(relationData, { transaction });
              } else {
                await Relation.create(relationData, { transaction });
              }
            } catch (error) {
              // Handle unique constraint errors gracefully
              if (error.name === 'SequelizeUniqueConstraintError') {
                logger.warn(`Skipping duplicate relation ${relatedId} for item ${newItem.id}`);
              } else {
                throw error; // Re-throw other errors
              }
            }
          }
        }
      });
    }

    logger.info('Items and their relations successfully updated.');
    return itemsWithReleases;
  } catch (error) {
    handleError(error);
  }
};

const handleError = (error) => {
  if (error.response) {
    if (error.response.status >= 500) {
      logger.error('Server error:', error.response.data);
    } else if (error.response.status >= 400) {
      logger.error('Client error:', error.response.data);
    }
  } else if (error.request) {
    logger.error('Network error:', error.message);
  } else {
    logger.error('Unexpected error:', error.message);
  }
  throw error;
};

module.exports = {
  fetchBacklogItems,
};
