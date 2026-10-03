const path = require('node:path');
module.exports = {
  content: [path.join(__dirname, 'frontend/**/*.{html,ts,tsx}')],
  theme: { extend: {} },
  plugins: [],
};
