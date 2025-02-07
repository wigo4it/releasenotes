const express = require('express');
const router = express.Router();
const { Release, Item, Relation } = require('../db/associations');
const { transformHtml } = require('../utils/sanitizeHtml');
const { Op } = require('sequelize');

router.get('/', async (req, res, next) => {
  try {
    const application = req.query.application || 'Socrates';
    const showAll = req.query.show === 'all';
    const authToken = process.env.AZURE_PERSONAL_ACCESS_TOKEN;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-based

    let whereClause = {
      applicatie: application === 'ServicesEnIntegratie' ? 'S&I' : application, // Always filter by application
    };

    if (!showAll) {
      let yearMonthPairs = [];

      // Generate valid (year, month) pairs
      for (let i = -3; i <= 1; i++) {
        let date = new Date(currentYear, currentMonth - 1 + i, 1);
        yearMonthPairs.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
      }

      // Add filtering by year-month pairs
      whereClause[Op.or] = yearMonthPairs;
    }

    // Fetch releases
    const releases = await Release.findAll({
      where: whereClause,
      include: {
        model: Item,
        as: 'items',
        include: {
          model: Relation,
          as: 'relations',
        },
      },
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    // Sanitize HTML content
    releases.forEach((release) => {
      release.items.forEach((item) => {
        ['userStory', 'acceptatiecriteria', 'stuurdatawijzigingen', 'batchwijzigingen', 'aandachtspunten'].forEach(
          (field) => {
            if (item[field]) {
              item[field] = transformHtml(item[field], authToken);
            }
          }
        );
      });
    });

    res.render('index', { releases, application, showAll });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
