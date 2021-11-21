const fs = require('fs');
const path = require('path');

if (!process.argv[2]) {
  console.error('Error: missing path to project folder');
  process.exit(-1);
}

const FOLDER = process.argv[2];

const exts = [
  'js', 'ts',
];

const ignoreFolders = [
  'node_modules',
];

const re = /\.(checkout|copy|delete|get|head|lock|merge|mkactivity|mkcol|move|notify|options|patch|post|purge|put|report|search|subscribe|trace|unlock|unsubscribe)\(('|"|`)/g;
const reUri = /^\/(\/?.\w+)+\w$/g;
let gCount = 0;
const debug = false;

const logRoute = (line, idx) => {
  if (line) {
    line = re.exec(line.trim())?.input.trim();
    if (line && line.match(reUri)) {
      const n = ++gCount;
      const ln = idx + 1;
      let method = line.split('(')[0].split('.');
      method = method[method.length - 1].toUpperCase();
      let endpoint = line.split(',')[0].split('(');
      endpoint = endpoint[endpoint.length - 1];
      endpoint = endpoint.substring(1, endpoint.length - 1);

      console.log(n, method, endpoint, `Ln ${ln}`, '\t', debug ? line : '');
    }
  }
};

const listAllRoutes = (fullPath) => {
  try {
    const data = fs.readFileSync(fullPath, 'UTF-8');
    const lines = data.split(/\r?\n/);
    lines.forEach((line, idx) => {
      logRoute(line, idx);
    });
  } catch (err) {
    console.error(err);
  }
};

const contains = (fullPath, strs) => {
  for (const str of strs) {
    if (fullPath.includes(str)) {
      return false;
    }
  }
  return true;
};

function main(directoryName) {
  fs.readdir(directoryName, (e, files) => {
    if (e) {
      console.error('Error: ', e);
      return;
    }

    files.forEach((file) => {
      const fullPath = path.join(directoryName, file);
      fs.stat(fullPath, (err, f) => {
        if (err) {
          console.error('Error: ', err);
          return;
        }
        if (f.isDirectory()) {
          if (contains(fullPath, ignoreFolders)) {
            main(fullPath);
          }
        } else {
          let tmp = file.split('.');
          tmp = tmp[tmp.length - 1];
          if (exts.includes(tmp)) {
            console.log(`\nRoutes in ${fullPath.replace(directoryName, '')}:`);
            listAllRoutes(fullPath);
          }
        }
      });
    });
  });
}

main(FOLDER);
