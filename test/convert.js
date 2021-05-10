const fs = require('fs');
const test = require('ava');
const nn = require('normalize-newline');
const fn = require('..');

const read = (file, cb) => fs.readFile(file, 'utf-8', (error, data) => cb(error, nn(data)));

process.chdir(__dirname);

test.cb('generate phpinfo html', (t) => {
  fn('fixtures/info.php', (error, data) => {
    t.is(error, null);
    t.regex(nn(data), /<title>.*phpinfo\(\).*<\/title>/);
    t.end();
  });
});

test.cb('generate index html', (t) => {
  fn('fixtures/index.php', (error, data) => {
    t.is(error, null);

    read('expected/index.html', (error, expected) => {
      t.is(error, null);
      t.is(nn(data), expected);
      t.end();
    });
  });
});

test.cb('consider "processLinks" option', (t) => {
  fn('fixtures/index.php', {processLinks: true}, (error, data) => {
    t.is(error, null);

    read('expected/index.processLinks.html', (error, expected) => {
      t.is(error, null);
      t.is(nn(data), expected);
      t.end();
    });
  });
});

test.cb('consider "getData" option', (t) => {
  fn('fixtures/get.php', {getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}}, (error, data) => {
    t.is(error, null);

    read('expected/get.html', (error, expected) => {
      t.is(error, null);
      t.is(nn(data), expected);
      t.end();
    });
  });
});

test.cb('use router script', (t) => {
  fn('/myroute', {router: 'fixtures/router.php'}, (error, data) => {
    t.is(error, null);
    t.is(nn(data), '/myroute');
    t.end();
  });
});
