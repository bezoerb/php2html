#!/usr/bin/env node
'use strict';

import php2html from './';
import os from 'os';
import fs from 'fs';
import path from 'path';
import meow from 'meow';
import chalk from 'chalk';
import indentString from 'indent-string';
import stdin from 'get-stdin';
import tail from 'lodash/tail';
import compact from 'lodash/compact';
import reduce from 'lodash/reduce';
import readPkgUp from 'read-pkg-up';
import tmp from 'tmp';
import updateNotifier from 'update-notifier';

let pkg = readPkgUp.sync().pkg;

let help = [
    'Usage: php2html <input> [<option>]',
    '',
    'Options:',
    '   -b, --baseDir        Your base directory',
    '   -r, --router         Specify router script',
    '   -p, --processLinks   Convert links pointing to .php pages to the .html equivalent.',
    '   -g, --getData        Pass data to php file using $_GET.'
].join('\n');

let cli = meow({
    help: help,
    pkg: pkg
}, {
    alias: {
        b: 'baseDir',
        r: 'router',
        p: 'processLinks',
        g: 'getData',
        v: 'version'
    }
});

// cleanup cli flags and assert cammelcase keeps camelcase
cli.flags = reduce(cli.flags, (res, val, key) => {
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
}, {});

if (cli.flags.getData) {
    try {
        cli.flags.getData = JSON.parse(cli.flags.getData);
    } catch (err) {
        error(err);
    }
}

if (cli.flags['update-notifier'] !== false) {
    updateNotifier({pkg: pkg}).notify();
}

function error(err) {
    process.stderr.write(indentString(chalk.red(err.message || err), '   ' + chalk.red('Error: ')));
    process.stderr.write(os.EOL);
    process.stderr.write(indentString(help, '   '));
    process.exit(1);
}

function prepare(data) {
    // check for references to original file
    let check = data.match(/(__DIR__)|(__FILE__)/);
    if (check) {
        let msg = '"' + compact(tail(check)).join('" and "') + '" detected. This can\'t be resolved for piped content.';
        return error(new Error(msg));
    }

    tmp.file({
        dir: cli.flags.baseDir || process.cwd(),
        prefix: '.cli-temp-',
        postfix: '.php'
    }, function (err, filepath, fd, cleanupCallback) {
        process.on('exit', cleanupCallback);

        if (err) {
            error(err);
        } else {
            fs.writeFile(filepath, data, (err) => err && error(err) || run(filepath, cleanupCallback));
        }
    });
}

function run(data, cleanupCallback) {
    try {
        php2html(data, cli.flags)
            .then(val => process.stdout.write(val))
            .catch(err => error(err));
    } catch (err) {
        if (cleanupCallback) {
            cleanupCallback();
        }
        error(err);
    }
}

if (cli.input[0]) {
    run(path.resolve(cli.input[0]));
} else {
    let timeout = setTimeout(cli.showHelp, 100);
    stdin().then(data => clearTimeout(timeout) && prepare(data));
}
