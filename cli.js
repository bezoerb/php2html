#!/usr/bin/env node
'use strict';
var os = require('os');
var fs = require('fs');
var path = require('path');
var meow = require('meow');
var indentString = require('indent-string');
var stdin = require('get-stdin');
var _ = require('lodash');
var tmp = require('tmp');
var php2html = require('./');
var pkg = require('./package.json');
var updateNotifier = require('update-notifier');
var ok;

var help = [
	'Usage: php2html <input> [<option>]',
	'',
	'Options:',
	'   -b, --baseDir           Your base directory',
	'   -r, --router            Specify router script',
	'   -p, --processLinks      Convert links pointing to .php pages to the .html equivalent.',
	'   -g, --getData      		Pass data to php file using $_GET.'
].join('\n');

var cli = meow({
	help: help
}, {
	alias: {
		b: 'baseDir',
		r: 'router',
		p: 'processLinks',
		g: 'getData'
	}
});

// cleanup cli flags and assert cammelcase keeps camelcase
cli.flags = _.reduce(cli.flags, function (res, val, key) {
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
	} catch(err) {
		error(err);
	}
}


if (cli.flags['update-notifier'] !== false) {
	updateNotifier({pkg: pkg}).notify();
}

function error(err) {
	process.stderr.write(indentString(err.message || err, '   Error: '));
	process.stderr.write(os.EOL);
	process.stderr.write(indentString(help, '   '));
	process.exit(1);
}

function prepare(data) {
	tmp.file({dir: cli.flags.baseDir || process.cwd(), prefix: '.cli-temp-', postfix: '.php'},function (err, filepath,fd, cleanupCallback) {
		process.on('exit', function(){
			cleanupCallback();
		});

		if (err) {
			error(err);
		} else {
			fs.writeFileSync(filepath,data);
			run(filepath,cleanupCallback);
		}
	});
}

function run(data,cleanupCallback) {
	ok = true;

	if (!data) {
		data = cli.input[0] ? path.resolve(cli.input[0]) : '';
	}

	try {
		php2html(data,cli.flags, function (err, val) {
			if (err) {
				error(err);
			} else {
				process.stdout.write(val);
			}
		});
	} catch (err) {
		if (cleanupCallback) {
			cleanupCallback();
		}
		error(err);
	}
}





if (cli.input[0]) {
	run();
} else {
	stdin(prepare);
	setTimeout(function () {
		if (ok) {
			return;
		}
		cli.showHelp();
	}, 100);
}
