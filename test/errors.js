const test = require('ava');
const fn = require('..');

process.chdir(__dirname);

test.cb('fail without input', (t) => {
  fn(undefined, (err, data) => {
    t.is(data, undefined);
    t.truthy(err && err.message);
    t.is(err.message, 'Missing input');
    t.end();
  });
});

test.cb('fail on missing file', (t) => {
  fn('missing', (err, data) => {
    t.is(data, undefined);
    t.truthy(err && err.message);
    t.regex(err.message, /ENOENT/);
    t.regex(err.message, /no such file or directory/);
    t.end();
  });
});

test.cb('fail on empty file', (t) => {
  fn('fixtures/empty.php', (err, data) => {
    /* jshint expr: true */
    t.falsy(data);
    t.truthy(err && err.message);
    t.is(err.message, '204 - No Content');
    t.end();
  });
});

test.cb('fail on unprocessable files', (t) => {
  fn('fixtures/nophp.txt', (err, data) => {
    /* jshint expr: true */
    t.falsy(data);
    t.truthy(err && err.message);
    t.end();
  });
});
