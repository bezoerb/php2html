#!/usr/bin/env node
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const meow = require('meow');
const chalk = require('chalk');
const indentString = require('indent-string');
const stdin = require('get-stdin');
const tail = require('lodash/tail');
const compact = require('lodash/compact');
const reduce = require('lodash/reduce');
const readPkgUp = require('read-pkg-up');
const tmp = require('tmp');
const updateNotifier = require('update-notifier');
const php2html = require('.');

const {packageJson} = readPkgUp.sync();

const help = [
  'Usage: php2html <input> [<option>]',
  '',
  'Options:',
  '   -b, --baseDir        Your base directory',
  '   -r, --router         Specify router script',
  '   -p, --processLinks   Convert links pointing to .php pages to the .html equivalent.',
  '   -g, --getData        Pass data to php file using $_GET.',
].join('\n');

const cli = meow({
  help,
  packageJson,
  flags: {
    baseDir: {
      type: 'string',
      alias: 'b',
    },
    router: {
      type: 'string',
      alias: 'r',
    },
    processLinks: {
      type: 'boolean',
      alias: 'p',
    },
    getData: {
      type: 'string',
      alias: 'g',
    },
  },
});

// Cleanup cli flags and assert cammelcase keeps camelcase
cli.flags = reduce(
  cli.flags,
  (res, val, key) => {
    if (key.length <= 1) {
      return res;
    }

    switch (key) {
      case 'processlinks':
        res.processLinks = val;
        break;
      case 'basedir':
        res.baseDir = val;
        break;
      case 'getdata':
        res.getData = val;
        break;
      default:
        res[key] = val;
    }

    return res;
  },
  {}
);

if (cli.flags.getData) {
  try {
    cli.flags.getData = JSON.parse(cli.flags.getData);
  } catch (error) {
    logError(error);
  }
}

if (cli.flags['update-notifier'] !== false) {
  updateNotifier({pkg: packageJson}).notify();
}

function logError(err) {
  process.stderr.write(indentString(chalk.red('Error: ' + err.message || err), 3));
  process.stderr.write(os.EOL);
  process.stderr.write(indentString(help, 3));
  process.exit(1);
}

function prepare(data) {
  if (process.stdin.isTTY) {
    cli.showHelp();
  }

  // Check for references to original file
  const check = data.match(/(__DIR__)|(__FILE__)/);
  if (check) {
    const msg = '"' + compact(tail(check)).join('" and "') + '" detected. This can\'t be resolved for piped content.';
    return logError(new Error(msg));
  }

  tmp.file(
    {
      dir: cli.flags.baseDir || process.cwd(),
      prefix: '.cli-temp-',
      postfix: '.php',
    },
    (error, filepath, fd, cleanupCallback) => {
      process.on('exit', cleanupCallback);
      process.on('cleanup', cleanupCallback);
      process.on('uncaughtException', cleanupCallback);

      if (error) {
        logError(error);
      } else {
        fs.writeFile(filepath, data, err => (err && logError(error)) || run(filepath));
      }
    }
  );
}

function run(data) {
  php2html(data, cli.flags)
    .then(val => process.stdout.write(val))
    .catch(error => logError(error));
}

if (cli.input[0]) {
  run(path.resolve(cli.input[0]));
} else {
  stdin().then(prepare);
}
