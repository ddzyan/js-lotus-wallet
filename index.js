const syncBlock = require('./lib/sysBlock');
const db = require('./orm/model');
const { lotus } = require('./config');

db.sequelize
  .authenticate()
  .then(() => {
    console.log('mysql connect success');

    syncBlock(lotus.url, lotus.token, 185513);
  })
  .catch(error => {
    console.error(error);
  });
