const syncBlock = require('./lib/sysBlock');
const db = require('./orm/model');

db.sequelize
  .authenticate()
  .then(() => {
    console.log('mysql connect success');
    const HTTP_URL = ' http://115.236.46.162:1234/rpc/v0';
    const API_TOKEN =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJBbGxvdyI6WyJyZWFkIiwid3JpdGUiLCJzaWduIl19.crmGqRVPmgLrNgYveL6GhwF07_tVJGHK1xSaEaPy-VE';

    syncBlock(HTTP_URL, API_TOKEN, 185513);
  })
  .catch(error => {
    console.error(error);
  });
