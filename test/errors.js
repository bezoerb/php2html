import {fileURLToPath} from 'node:url';
import test from 'ava';
import path from 'node:path';
import fn from '../index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

test.cb('fail without input', (t) => {
  fn(undefined, (error, data) => {
    t.is(data, undefined);
    t.truthy(error && error.message);
    t.is(error.message, 'Missing input');
    t.end();
  });
});

test.cb('fail on missing file', (t) => {
  fn('missing', (error, data) => {
    t.is(data, undefined);
    t.truthy(error && error.message);
    t.regex(error.message, /ENOENT/);
    t.regex(error.message, /no such file or directory/);
    t.end();
  });
});

test.cb('fail on empty file', (t) => {
  fn('fixtures/empty.php', (error, data) => {
    /* jshint expr: true */
    t.falsy(data);
    t.truthy(error && error.message);
    t.is(error.message, '204 - No Content');
    t.end();
  });
});

test.cb('fail on unprocessable files', (t) => {
  fn('fixtures/nophp.txt', (error, data) => {
    /* jshint expr: true */
    t.falsy(data);
    t.truthy(error && error.message);
    t.end();
  });
});
