import child_process = require('child_process');

const res = child_process.execSync('git diff --shortstat');
console.log('→: res', res.toString());
