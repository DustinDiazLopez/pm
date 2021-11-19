const fs = require('fs');

try {
  console.log(fs.readFileSync('LICENSE', 'UTF-8'));
} catch (err) {
  console.error(err);
}