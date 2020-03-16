
const Zly = require('./index');
const open = require('open');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const expressWS = require('express-ws');
const path = require('path');
const fs = require('fs');

exports.server = config => {
  const { entry, workspace, extnames } = config;
  const dir = path.dirname(__dirname);
  const app = express();
  expressWS(app);
  app.use('/', swaggerUi.serve);
  app.use('/static', express.static(path.join(dir, 'static')));
  app.get('/', (req, res, next) => {
    const zly = new Zly(entry, workspace, extnames);
    const data = zly.run();
    const options = {
      customJs: '/static/ws.js'
    }
    return swaggerUi.setup(data, options)(req, res, next);
  });
  app.get('/spec', (req, res) => {
    const zly = new Zly(entry, workspace, extnames);
    const data = zly.run();
    res.send(JSON.stringify(data));
  });

  app.ws('/ws', (ws, req) => {
    ws.on('message', msg => {
      if (msg === 'ready' ) {
        fs.watch(config.workspace, { encoding: 'buffer' }, (type, file) => {
          ws && ws.readyState === 1 && ws.send('change');
        });
      }
    })
  });

  app.listen(2020, () => {
    open(`http://localhost:${config.port}/`, { background: true });
  });
  }

