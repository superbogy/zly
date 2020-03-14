#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs');
const color = require('cli-color');
const Yaml = require('yaml');
const Zly = require('../lib/index');
const watcher = require('chokidar');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const expressWS = require('express-ws');
const path = require('path');
const server = require('../lib/server').server;

const startServer1 = (entry, workspace, extnames, port=2020) => {
  const app = express();
  expressWS(app);
  app.use('/', swaggerUi.serve);
  app.use('/static', express.static(path.resolve('../static')));
  app.get('/', (req, res, next) => {
    const zly = new Zly(entry, workspace, extnames);
    data = zly.run();
    const options = {
      customJs: '/static/ws.js'
    }
    return swaggerUi.setup(data, options)(req, res, next);
  });
  app.get('/ws', function(req, res, next){
    console.log('get route', req.testing);
    res.end();
  });
   
  app.ws('/ws', function(ws, req) {
    ws.on('message', function(msg) {
      console.log(msg);
    });
    console.log('socket', req.testing);
  });
  
  app.listen(2020, );
};

commander.version('0.1.2')
  .option('-o, --output <path>', 'put the result to file')
  .option('-w, --workspace', 'yaml file root path')
  .option('-f, --format <type>', 'format output style, yaml or json', 'yaml')
  .option('-p, --pretty', 'pretty out put')
  .option('-s, --server', 'start a swagger ui')
  .option('-e, --extname <ext>', 'extend name, split with comma')
  .parse(process.argv);

try {
  const entry = commander.args[0];
  if (!entry) {
    console.error(color.red('ERROR! No argument passed to command module'));
    commander.help();
    process.exit(1);
  }

  if (!fs.existsSync(entry)) {
    console.error(color.red('target file not found~!'));
    process.exit(2);
  }

  const extname = commander.extname;
  let extnames = []
  if (extname) {
    extnames = extname.split(',').filter(item => item);
  }

  const workspace = commander.workspace;
  const zly = new Zly(entry, workspace, extnames);
  const out = zly.run();
  let document = ''
  if (commander.format === 'yaml') {
    document = Yaml.stringify(out);
  } else {
    document = JSON.stringify(out);
  }

  if (commander.output) {
    fs.writeFileSync(commander.output, document);
  } else if (commander.server) {
    const options = {
      entry,
      extname,
      port: 2020,
      workspace: workspace || zly.root,
    };
    server(options);
  } else {
    console.log(document);
  }
} catch (err) {
  console.error(color.red(err.message));
}

