const fs = require('fs');
const excel = require('excel4node');

const workbook = new excel.Workbook();

const style = workbook.createStyle({
  font: {
    color: 'black',
    size: 12,
  },
});

if (!process.argv[2]) {
  console.error('Error: missing path to postman collection');
  process.exit(-1);
}

if (!process.argv[3]) {
  console.error('Error: missing output path');
  process.exit(-2);
}

const COLLECTION_PATH = process.argv[2];
const OUT_PATH = process.argv[3];

if (!COLLECTION_PATH.endsWith('.json')) {
  console.error('Error: collection path must end with .json');
  process.exit(-4);
}

if (!OUT_PATH.endsWith('.xlsx')) {
  console.error('Error: output path must end with .xlsx');
  process.exit(-4);
}

const worksheet = workbook.addWorksheet(COLLECTION_PATH);

const fixBody = (strJson) => {
  if (typeof strJson === 'string' || strJson instanceof String) {
    return JSON.stringify(JSON.parse(strJson), undefined, 2);
  }

  if (typeof strJson === 'object') {
    console.log('using object');
    return JSON.stringify(strJson, undefined, 2);
  }

  console.error(typeof strJson, 'is not supported for body');
  return strJson;
};

const headerToString = (header, separator = ':') => {
  const builder = [];
  for (const h of header) {
    const { key } = h;
    const { value } = h;
    builder.push(`${key}${separator}${value}\n`);
  }
  return builder.join('');
};

function validName(itemName) {
  const isMaster = itemName.includes('master');
  const isLocal = itemName.includes('local');
  return (isMaster || isLocal) && (isMaster !== isLocal);
}

function getUrl(req) {
  const { url } = req;
  if (url.raw) {
    return url.raw;
  }

  if (typeof url === 'string' || url instanceof String) {
    return url;
  }

  console.log(`Invalid URL: ${url}`);
  return url;
}

let row = 1;
let col = 0;
worksheet.cell(row, ++col).string('Endpoint').style(style);
worksheet.cell(row, ++col).string('Method').style(style);
worksheet.cell(row, ++col).string('Master URL').style(style);
worksheet.cell(row, ++col).string('Local URL').style(style);
worksheet.cell(row, ++col).string('Master Request Header').style(style);
worksheet.cell(row, ++col).string('Local Request Header').style(style);
worksheet.cell(row, ++col).string('Master Request Body').style(style);
worksheet.cell(row, ++col).string('Local Request Body').style(style);
worksheet.cell(row, ++col).string('Master Response Header').style(style);
worksheet.cell(row, ++col).string('Local Response Header').style(style);
worksheet.cell(row, ++col).string('Master Response Body').style(style);
worksheet.cell(row, ++col).string('Local Response Body').style(style);
worksheet.cell(row, ++col).string('Master Response Status').style(style);
worksheet.cell(row, ++col).string('Local Response Status').style(style);
row++;

fs.readFile(COLLECTION_PATH, 'utf8', (err, data) => {
  if (err) {
    console.log(`Error reading file from disk: ${err}`);
  } else {
    const collection = JSON.parse(data);
    const items = collection.item;
    if (Array.isArray(items) && items.length > 0) {
      // console.log(items)
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // console.log('name: ', item.name);
        // console.log('item', Object.keys(item));
        const responses = item.response;
        if (Array.isArray(responses) && responses.length > 0) {
          for (let j = 0; j < responses.length; j++) {
            const savedResponse = responses[j];
            if (!validName(savedResponse.name)) {
              console.error(`${savedResponse.name} is not a valid name. It must contain either 'master' or 'local' in its name, for example, master-${savedResponse.name} or local-${savedResponse.name}`);
              process.exit(3);
            } else if (responses.length !== 2) {
              console.log(`Expected 2 reponses in '${item.name}' but got ${savedResponse.reponse.length}`);
              process.exit(4);
            } else {
              const res0 = item.response[0];
              const res1 = item.response[1];
              res0.isMaster = res0.name.includes('master');

              const masterRes = res0.isMaster ? res0 : res1;
              const localRes = res0.isMaster ? res1 : res0;
              const masterReq = masterRes.originalRequest;
              const localReq = localRes.originalRequest;

              const endpoint = masterRes.name.replace('master', '');
              const { method } = masterReq;
              const masterUrl = getUrl(masterReq);
              const localUrl = getUrl(localReq);
              const masterRequestHeader = headerToString(masterReq.header);
              const masterRequestBody = masterReq.body.raw || 'None';
              const localRequestHeader = headerToString(localReq.header);
              const localRequestBody = localReq.body.raw || 'None';
              const masterResponseHeader = headerToString(masterRes.header);
              const masterResponseBody = fixBody(masterRes.body);
              const masterResponseStatus = masterRes.status;
              const localResponseHeader = headerToString(localRes.header);
              const localResponseBody = fixBody(localRes.body);
              const localResponseStatus = localRes.status;

              col = 0;
              worksheet.cell(row, ++col).string(endpoint).style(style);
              worksheet.cell(row, ++col).string(method).style(style);
              worksheet.cell(row, ++col).string(masterUrl).style(style);
              worksheet.cell(row, ++col).string(localUrl).style(style);
              worksheet.cell(row, ++col).string(masterRequestHeader).style(style);
              worksheet.cell(row, ++col).string(localRequestHeader).style(style);
              worksheet.cell(row, ++col).string(masterRequestBody).style(style);
              worksheet.cell(row, ++col).string(localRequestBody).style(style);
              worksheet.cell(row, ++col).string(masterResponseHeader).style(style);
              worksheet.cell(row, ++col).string(localResponseHeader).style(style);
              worksheet.cell(row, ++col).string(masterResponseBody).style(style);
              worksheet.cell(row, ++col).string(localResponseBody).style(style);
              worksheet.cell(row, ++col).string(masterResponseStatus).style(style);
              worksheet.cell(row, ++col).string(localResponseStatus).style(style);
              row++;
              break;
            }
          }
        } else {
          console.log(`No saved reponses found for '${item.name}' (${COLLECTION_PATH})`);
          process.exit(2);
        }
      }
    } else {
      console.log(`No items found in collection: '${COLLECTION_PATH}'`);
      process.exit(1);
    }
  }

  workbook.write(OUT_PATH);
  console.log('Finished writing excel file.');
});
