const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

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

const fixBody = (strJson) => {
  // TODO: indent json string
  return strJson;
};

const csvWriter = createCsvWriter({
  path: OUT_PATH,
  header: [
    { id: 'endpoint', title: 'Endpoint' },
    { id: 'method', title: 'Method' },

    { id: 'masterUrl', title: 'Master URL' },
    { id: 'localUrl', title: 'Development URL' },

    { id: 'masterRequestHeader', title: 'Master Request Header' },
    { id: 'localRequestHeader', title: 'Development Request Header' },

    { id: 'masterRequestBody', title: 'Master Request Body' },
    { id: 'localRequestBody', title: 'Development Request Body' },

    { id: 'masterResponseHeader', title: 'Master Response Header' },
    { id: 'localResponseHeader', title: 'Development Response Header' },

    { id: 'masterResponseBody', title: 'Master Response Body' },
    { id: 'localResponseBody', title: 'Development Response Body' },

    { id: 'masterResponseStatus', title: 'Master Response Status' },
    { id: 'localResponseStatus', title: 'Development Response Status' },
  ]
});

const headerToString = (header, separator=':') => {
  const builder = [];
  for (const h of header) {
    const key = h.key;
    const value = h.value;
    // console.log(`${key}${del}${value}`);
    builder.push(`${key}${separator}${value}\n`);
  }
  return builder.join('');
};

const row = (endpoint, method, 
  masterUrl, localUrl,
  masterRequestHeader, masterRequestBody, 
  localRequestHeader, localRequestBody, 
  masterResponseHeader, masterResponseBody,
  localResponseHeader, localResponseBody,
  localResponseStatus, masterResponseStatus) => {
    return {
      endpoint,
      method,
      masterUrl,
      localUrl,
      masterRequestHeader, 
      localRequestHeader,
      masterRequestBody,
      localRequestBody,
      masterResponseHeader, 
      localResponseHeader,
      masterResponseBody,
      localResponseBody,
      localResponseStatus,
      masterResponseStatus,
    };
};

function validName(itemName) {
  const isMaster = itemName.includes('master');
  const isLocal = itemName.includes('local');
  return (isMaster || isLocal) && (isMaster !== isLocal);
}

fs.readFile(COLLECTION_PATH, 'utf8', (err, data) => {
  const result = [];
  if (err) {
    console.log(`Error reading file from disk: ${err}`);
  } else {
    const collection = JSON.parse(data);
    const items = collection.item;
    if (Array.isArray(items) && items.length > 0) {
      // console.log(items)
      for (let i = 0; i < items.length; i++) {
        const item  = items[i];
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
              const method = masterReq.method;
              const masterUrl = masterReq.url;
              const localUrl = localReq.url;
              const masterRequestHeader = headerToString(masterReq.header);
              const masterRequestBody = masterReq.body.raw;
              const localRequestHeader = headerToString(localReq.header);
              const localRequestBody = localReq.body.raw;
              const masterResponseHeader = headerToString(masterRes.header);
              const masterResponseBody = fixBody(masterRes.body);
              const masterResponseStatus = masterRes.status;
              const localResponseHeader = headerToString(localRes.header);
              const localResponseBody = fixBody(localRes.body);
              const localResponseStatus = localRes.status;
              const entry = row(endpoint, method,
                  masterUrl, localUrl,
                  masterRequestHeader, masterRequestBody,
                  localRequestHeader, localRequestBody,
                  masterResponseHeader, masterResponseBody,
                  localResponseHeader, localResponseBody,
                  localResponseStatus, masterResponseStatus
              );

              result.push(entry);
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

  csvWriter
    .writeRecords(result)
    .then(() => console.log('The CSV file was written successfully'))
    .catch((err) => console.error('Failed to write csv', err));
});
