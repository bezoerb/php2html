const cp = require('child_process');
const fs = require('fs');
const test = require('ava');
const readPkg = require('read-package-json');
const nn = require('normalize-newline');

const read = (file, cb) => fs.readFile(file, 'utf-8', (err, data) => cb(err, nn(data)));

process.chdir(__dirname);

test.cb.beforeEach(t =>
  readPkg('../package.json', (err, pkg) => {
    t.is(err, null);
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

    read('expected/index.html', (err, expected) => {
      t.is(err, null);
      t.is(nn(stdout), expected);
      t.end();
    });
  });
});

test.cb('work well with the php file piped to php2html', t => {
  cp.exec('cat fixtures/info.php | node ' + t.context.bin, (err, stdout) => {
    t.is(err, null);
    t.truthy(/<title>phpinfo\(\)<\/title>/.test(nn(stdout)));
    t.truthy(/<h1 class="p">PHP Version/.test(nn(stdout)));
    t.end();
  });
});

test.cb('fail if the piped file contains "__FILE__" or "__DIR__"', t => {
  t.plan(4);
  cp.exec('cat fixtures/index.php | node ' + t.context.bin, (err, stdout, stderr) => {
    t.truthy(err);
    t.truthy(stderr);
    t.falsy(stdout);
    t.truthy(/Error: "__FILE__" detected. This can't be resolved for piped content./.test(stderr));
    t.end();
  });
});
