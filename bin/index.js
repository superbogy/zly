#!/usr/bin/env node

const commander = require('commander');
const fs = require('fs');
const color = require('cli-color');
const Yaml = require('yaml');
const Zly = require('../lib/index');
const watcher = require('chokidar');
const open = require('open');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const http = require('http');

const monitor = {};
const restart = (entry, workspace, extnames) => {
  monitor.pending = true;
  monitor.action = 'restart';
  if (!monitor.server) {
    const app = express();
    app.use('/', swaggerUi.serve);
    app.get('/', (req, res, next) => {
      const zly = new Zly(entry, workspace, extnames);
      data = zly.run();
      return swaggerUi.setup(data)(req, res, next);
    });
    const server = http.createServer(app);
    monitor.state = 'running';
    monitor.pending = false;
    server.listen('3300', '0.0.0.0');
    server.on('listening', () => {
      open('http://localhost:3300/', { background: true });
    });
    monitor.server = server;
  }
};

commander.version('0.1.1')
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
  const root = zly.root;
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
    watcher.watch(workspace || root, {
      interval: 1000,
      binaryInterval: 2000,
      alwaysStat: false,
      depth: 99,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 1000
      },
    }).on('change', _ => restart(entry, workspace, extnames))
      .on('ready', _ => restart(entry, workspace, extnames))
      .on('unlink', _ => restart(entry, workspace, extnames))
      .on('error', function (err) {
        console.log('uncatchException', err);
      });
  } else {
    console.log(document);
  }
} catch (err) {
  console.error(color.red(err.message));
}

