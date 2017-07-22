const fs = require('fs');
const csvParse = require('csv-parse');

const rawCountydata = fs.readFileSync('SAPS2016_CTY31.csv');

csvParse(rawCountydata, {
  columns: true
}, extractMigration);

function extractMigration(error, parsedData) {
  if (error) {
    console.error(error);
    return;
  }

  const extractedData = parsedData.map(row => ({
    id: row.GEOGID,
    description: row.GEOGDESC,
    fromAbroad: row.T2_3OI,
    total: row.T2_3T
  }));

  fs.writeFileSync(
    'immigration-by-county.json',
    JSON.stringify(extractedData),
    'utf-8'
  );
}
