const Zly = require('./index');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const expressWS = require('express-ws');
const path = require('path');
const chokidar = require('chokidar');
const color = require('cli-color');

exports.server = (config) => {
  const { entry, workspace, extnames } = config;
  const dir = path.dirname(__dirname);
  const app = express();

  expressWS(app);
  app.use('/', swaggerUi.serve);
  app.use('/static', express.static(path.join(dir, 'static')));
  app.get('/', async (req, res, next) => {
    const zly = new Zly(entry, workspace, extnames);
    const data = await zly.run();
    const options = {
      customJs: '/static/ws.js',
    };
    return swaggerUi.setup(data, options)(req, res, next);
  });
  app.get('/spec', async (req, res) => {
    const zly = new Zly(entry, workspace, extnames);
    const data = await zly.run();
    res.send(JSON.stringify(data));
  });

  app.ws('/ws', (ws, req) => {
    ws.on('message', (msg) => {
      if (msg === 'ready' && !Zly.isUrl(entry)) {
        chokidar.watch(config.workspace).on('all', (event, path) => {
          ws && ws.readyState === 1 && ws.send('change');
        });
      }
    });
  });

  app.listen(2020, (err) => {
    if (err) {
      console.error(color.red(err.message));
    }
    console.log(color.green(`visit: http://localhost:${config.port}/`));
  });
};
