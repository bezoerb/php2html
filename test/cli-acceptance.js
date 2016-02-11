import test from 'ava';
import path from 'path';
import readPkg from 'read-package-json';
import nn from 'normalize-newline';
import cp from 'child_process';
import fs from 'fs';
import fn from '../';

let read = (file, cb) => fs.readFile(file, 'utf-8', (err, data) => cb(nn(data)));

test.cb.beforeEach(t =>
    readPkg('../package.json', (err, pkg) => {
        t.context.bin = '../' + pkg.bin.php2html;
        t.context.version = pkg.version;
        t.end();
    })
);


test.cb('return the version', t => {
    cp.execFile('node', [t.context.bin, '--version', '--no-update-notifier'], (err, stdout) => {
        t.is(err, null);
        t.is(stdout.replace(/\r\n|\n/g, ''), t.context.version);
        t.end();
    });
});

test.cb('work well with the php file passed as an option', t => {
    cp.execFile('node', [t.context.bin, 'fixtures/index.php'], (err, stdout) => {
        t.is(err, null);

        read('expected/index.html', expected => {
            t.is(nn(stdout), expected);
            t.end();
        });
    });
});

test.cb('work well with the php file piped to php2html', t => {
    cp.exec('cat fixtures/info.php | node ' + t.context.bin, (err, stdout) => {
        t.is(err, null);
        t.ok(/<title>phpinfo\(\)<\/title>/.test(nn(stdout)));
        t.ok(/<h1 class="p">PHP Version/.test(nn(stdout)));
        t.end();
    });
});

test.cb('fail if the piped file contains "__FILE__" or "__DIR__"', t => {
    cp.exec('cat fixtures/index.php | node ' + t.context.bin, (err, stdout) => {
        t.ok(err && err.message);
        t.notOk(stdout);
        t.ok(/Error: "__FILE__" detected. This can't be resolved for piped content./.test(err.message));
        t.end();
    });
});
