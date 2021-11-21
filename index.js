const fs = require('fs');

function license() {
  try {
    console.log(fs.readFileSync('LICENSE', 'UTF-8'));
  } catch (err) {
    console.error(err);
  }
};

license();