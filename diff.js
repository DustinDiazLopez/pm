/* eslint-disable no-loop-func */
const fs = require('fs');
const readline = require('readline-sync');
const { exec } = require('child_process');

const COLLECTION_PATH = process.argv[2];

if (!COLLECTION_PATH) {
  console.error('Please provide path to postman collection.');
  process.exit(-1);
}

function execDiff(file1, file2) {
  exec(`code --diff ${file1} ${file2}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

function stringify(obj, indent = false) {
  if (typeof obj === 'string') {
    try {
      const json = JSON.parse(obj);
      if (json && typeof json !== 'object') {
        obj = json;
      }
    // eslint-disable-next-line no-empty
    } catch (ignore) {}
  }

  if (typeof obj === 'object') {
    return indent ? JSON.stringify(obj, undefined, 4) : JSON.stringify(obj);
  }
  return obj;
}

const headerToString = (header, separator = ':') => {
  const builder = [];
  for (const h of header) {
    const { key } = h;
    const { value } = h;
    builder.push(`${key}${separator}${value}\n`);
  }
  return builder.join('').trim();
};

function format(res) {
  const req = res.originalRequest;
  const reqUrl = stringify(req.url.raw || req.url);
  const reqMethod = stringify(req.method);
  const reqBody = stringify(req.body.raw || req.body, true);
  const reqHeaders = headerToString(req.header)?.trim() || '[No Headers]';
  const resBody = stringify(res.body.raw || res.body, true);
  const resHeaders = headerToString(res.header)?.trim() || '[No Headers]';
  const resStatusCode = stringify(res.code);
  const resStatus = stringify(res.status);
  return `
${res.name}:
${reqMethod} ${reqUrl} (${res.responseTime} ms)
${resStatusCode} (${resStatus})

REQ_HEADER:
${reqHeaders}

REQ_BODY:
${reqBody}

RES_HEADER:
${resHeaders}

RES_BODY:
${resBody}

  `.trim();
}

let data = fs.readFileSync(COLLECTION_PATH, {
  encoding: 'utf8',
  flag: 'r',
});

if (data) {
  // Display the file data
  data = JSON.parse(data)?.item;
  const dataKeys = Object.keys(data);
  if (data) {
    for (const i of dataKeys) {
      const { response } = data[i];
      const responseKeys = Object.keys(response);
      if (response && responseKeys.length > 0) {
        if (responseKeys.length >= 2) {
          (async () => {
            const name1 = `1${encodeURI(response[responseKeys[0]].name).replaceAll('/', '.')}.diff`;
            const name2 = `2${encodeURI(response[responseKeys[1]].name).replaceAll('/', '.')}.diff`;
            const diff1 = format(response[responseKeys[0]]);
            const diff2 = format(response[responseKeys[1]]);
            fs.writeFileSync(name1, diff1);
            fs.writeFileSync(name2, diff2);

            execDiff(name1, name2);
            readline.question('Hit ENTER to continue...');
            console.log(dataKeys.length - parseInt(i, 10), 'remaining');

            if (fs.existsSync(name1)) {
              fs.unlink(name1, (err) => {
                if (err) {
                  console.log(err);
                }
                console.log('deleted', name1);
              });
            }

            if (fs.existsSync(name2)) {
              fs.unlink(name2, (err) => {
                if (err) {
                  console.log(err);
                }
                console.log('deleted', name2);
              });
            }
          })();
          // break;
        } else {
          console.error('Need more than one response saved for', data[i]?.name);
        }
      } else {
        console.error('No reponse for', data[i]?.name);
      }
    }
  } else {
    console.error('No items');
  }
} else {
  console.error('Empty collection?');
}
