/* eslint-disable quote-props */
/* eslint-disable dot-notation */
const fs = require('fs');
const csv = require('fast-csv');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3];

if (!INPUT_FILE) {
  console.error('Please provide path to the checkmarx csv report.');
  console.log('npm run chxcsv <scan-report.csv> <scan-report.min.csv>');
  process.exit(-1);
}

if (!OUTPUT_FILE) {
  console.error('Please provide path to output the file.');
  console.log('npm run chxcsv <scan-report.csv> <scan-report.min.csv>');
  process.exit(-1);
}

const csvWriter = createCsvWriter({
  path: OUTPUT_FILE,
  alwaysQuote: true,
  header: [
    { id: 'Detection Date', title: 'Detection Date' },
    { id: 'Result Severity', title: 'Result Severity' },
    { id: 'Query Language', title: 'Query Language' },
    { id: 'Query Name', title: 'Query Name' },
    { id: 'Source Filename', title: 'Source Filename' },
    { id: 'Line', title: 'Line' },

  ],
});

const lang = (filename) => {
  filename = filename.toLowerCase().trim();
  if (filename.endsWith('.js')) {
    return 'JavaScript';
  }

  if (filename.endsWith('.ts')) {
    return 'Typecript';
  }

  if (filename.endsWith('.java')) {
    return 'Java';
  }

  if (filename.endsWith('.py')) {
    return 'Python';
  }

  return '';
};

const isMedOrHigh = (severity) => {
  severity = severity.toLowerCase().trim();
  return severity === 'high' || severity === 'medium';
};

const data = [];

fs.createReadStream(INPUT_FILE)
  .pipe(csv.parse({ headers: true }))
  .on('error', (error) => console.error(error))
  .on('data', (row) => {
    const severity = row['Result Severity'];
    const filename = row['SrcFileName'];
    if (isMedOrHigh(severity)) {
      data.push({
        'Detection Date': new Date(row['Detection Date']).toLocaleDateString() || new Date().toLocaleDateString(),
        'Result Severity': severity,
        'Query Language': lang(filename),
        'Query Name': row['Query'],
        'Source Filename': filename,
        'Line': row['Line'],
      });
    }
  })
  .on('end', (rowCount) => {
    console.log(`Parsed ${rowCount} rows`);
    csvWriter
      .writeRecords(data)
      .then(() => console.log('The CSV file was written successfully'));
  });
