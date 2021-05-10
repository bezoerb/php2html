#!/usr/bin/env node
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import meow from 'meow';
import chalk from 'chalk';
import indentString from 'indent-string';
import stdin from 'get-stdin';
import tail from 'lodash/tail.js';
import compact from 'lodash/compact.js';
import reduce from 'lodash/reduce.js';
import {readPackageUpSync} from 'read-pkg-up';
import tmp from 'tmp';
import updateNotifier from 'update-notifier';
import php2html from './index.js';

tmp.setGracefulCleanup();
const {packageJson} = readPackageUpSync();

const help = [
  'Usage: php2html <input> [<option>]',
  '',
  'Options:',
  '   -b, --baseDir        Your base directory',
  '   -r, --router         Specify router script',
  '   -p, --processLinks   Convert links pointing to .php pages to the .html equivalent.',
  '   -g, --getData        Pass data to php file using $_GET.',
].join('\n');

tmp.setGracefulCleanup();

const cli = meow({
  help,
  importMeta: import.meta,
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
  (result, value, key) => {
    if (key.length <= 1) {
      return result;
    }

    switch (key) {
      case 'processlinks':
        result.processLinks = value;
        break;
      case 'basedir':
        result.baseDir = value;
        break;
      case 'getdata':
        result.getData = value;
        break;
      default:
        result[key] = value;
    }

    return result;
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

function logError(error) {
  process.stderr.write(indentString(chalk.red('Error: ' + error.message || error), 3));
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
    const message =
      '"' + compact(tail(check)).join('" and "') + '" detected. This can\'t be resolved for piped content.';
    return logError(new Error(message));
  }

  tmp.file(
    {
      tmpdir: cli.flags.baseDir || process.cwd(),
      prefix: '.cli-temp-',
      postfix: '.php',
    },
    (error, filepath, fd, cleanupCallback) => {
      process.on('exit', () => cleanupCallback());
      process.on('cleanup', () => cleanupCallback());
      process.on('uncaughtException', () => cleanupCallback());

      if (error) {
        logError(error);
      } else {
        fs.writeFile(filepath, data, (error_) => (error_ && logError(error)) || run(filepath));
      }
    }
  );
}

function run(data) {
  php2html(data, cli.flags)
    .then((value) => process.stdout.write(value))
    .catch((error) => logError(error));
}

if (cli.input[0]) {
  run(path.resolve(cli.input[0]));
} else {
  stdin().then(prepare);
}
