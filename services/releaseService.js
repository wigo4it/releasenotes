const { Release } = require('../db/associations');

/**
 * Extract application name and release name from Azure DevOps release field
 * @param {string} fullRelease - Full release field from Azure DevOps (e.g., "Socrates 2025.020")
 * @returns {object} - { applicatie, release }
 */
const extractReleaseDetails = (fullRelease) => {
  if (!fullRelease || typeof fullRelease !== 'string') {
    throw new Error(`Invalid fullRelease field: ${fullRelease}`);
  }

  const [applicatie, ...releaseParts] = fullRelease.split(' '); // Split on space
  const release = releaseParts.join(' '); // Rejoin the rest as the release name

  if (!['Socrates', 'S&I'].includes(applicatie)) {
    throw new Error(`Unknown applicatie detected: ${applicatie}`);
  }

  return { applicatie, release };
};

/**
 * Process releases from Azure DevOps items
 * - Add new releases to the database
 * - Update items to reference releaseId instead of the release name
 */
const processReleases = async (items) => {
  try {
    // Extract and deduplicate release details
    const releaseDetails = [
      ...new Set(
        items
          .map((item) => item.release)
          .filter(Boolean) // Remove null/undefined/empty values
          .map((release) => {
            try {
              return extractReleaseDetails(release); // Validate each release
            } catch (error) {
              console.warn(`Skipping invalid release: ${release} - ${error.message}`);
              return null; // Skip invalid releases
            }
          })
          .filter(Boolean) // Remove invalid releases
          .map((detail) => `${detail.applicatie} ${detail.release}`) // Create a unique key
      ),
    ].map((key) => {
      const [applicatie, ...releaseParts] = key.split(' ');
      return { applicatie, release: releaseParts.join(' ') };
    });

    // Find existing releases in the database
    const existingReleases = await Release.findAll({
      where: {
        name: releaseDetails.map((detail) => detail.release),
      },
    });

    // Map existing releases by name for quick lookup
    const existingReleaseMap = Object.fromEntries(
      existingReleases.map((release) => [`${release.applicatie} ${release.name}`, release.id])
    );

    // Identify new releases
    const newReleases = releaseDetails.filter(
      (detail) => !existingReleaseMap[`${detail.applicatie} ${detail.release}`]
    );

    // Add new releases to the database
    if (newReleases.length > 0) {
      console.log(`Adding new releases: ${newReleases.map((r) => r.release).join(', ')}`);
      const createdReleases = await Release.bulkCreate(
        newReleases.map(({ release, applicatie }) => {
          const { year, month } = Release.parseNameForDate(release, applicatie); // Ensure parsing before insert
          return {
            name: release,
            applicatie,
            year,
            month,
          };
        }),
        { individualHooks: true } // Ensures beforeValidate and other hooks execute
      );

      // Add newly created releases to the release map
      createdReleases.forEach((release) => {
        existingReleaseMap[`${release.applicatie} ${release.name}`] = release.id;
      });
    }

    // Retrieve all releases (existing + newly created) for accurate mapping
    const allReleases = await Release.findAll();
    const finalReleaseMap = Object.fromEntries(
      allReleases.map((release) => [`${release.applicatie} ${release.name}`, release.id])
    );

    // Update items to reference releaseId
    const updatedItems = items.map((item) => {
      if (!item.release) {
        console.warn(`Skipping item with missing release field: ${item.id}`);
        return { ...item, releaseId: null };
      }

      const { applicatie, release } = extractReleaseDetails(item.release);
      const releaseKey = `${applicatie} ${release}`;
      const releaseId = finalReleaseMap[releaseKey];

      if (!releaseId) {
        console.warn(`No releaseId found for item: ${item.id}, release: ${releaseKey}`);
      }

      return {
        ...item,
        releaseId: releaseId || null, // Map full release name to releaseId
      };
    });

    return updatedItems;
  } catch (error) {
    console.error('Error processing releases:', error);
    throw error;
  }
};

module.exports = { processReleases };