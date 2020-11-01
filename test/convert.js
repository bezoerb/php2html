const fs = require('fs');
const test = require('ava');
const nn = require('normalize-newline');
const fn = require('..');

const read = (file, cb) => fs.readFile(file, 'utf-8', (err, data) => cb(err, nn(data)));

process.chdir(__dirname);

test.cb('generate phpinfo html', (t) => {
  fn('fixtures/info.php', (err, data) => {
    t.is(err, null);
    t.regex(nn(data), /<title>.*phpinfo\(\).*<\/title>/);
    t.end();
  });
});

test.cb('generate index html', (t) => {
  fn('fixtures/index.php', (err, data) => {
    t.is(err, null);

    read('expected/index.html', (err, expected) => {
      t.is(err, null);
      t.is(nn(data), expected);
      t.end();
    });
  });
});

test.cb('consider "processLinks" option', (t) => {
  fn('fixtures/index.php', {processLinks: true}, (err, data) => {
    t.is(err, null);

    read('expected/index.processLinks.html', (err, expected) => {
      t.is(err, null);
      t.is(nn(data), expected);
      t.end();
    });
  });
});

test.cb('consider "getData" option', (t) => {
  fn('fixtures/get.php', {getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}}, (err, data) => {
    t.is(err, null);

    read('expected/get.html', (err, expected) => {
      t.is(err, null);
      t.is(nn(data), expected);
      t.end();
    });
  });
});

test.cb('use router script', (t) => {
  fn('/myroute', {router: 'fixtures/router.php'}, (err, data) => {
    t.is(err, null);
    t.is(nn(data), '/myroute');
    t.end();
  });
});
