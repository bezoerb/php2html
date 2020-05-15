const path = require('path');
const test = require('ava');
const partial = require('lodash/partial');
const async = require('async');
const fn = require('..');

process.chdir(__dirname);

test.cb('handle multiple parallel calls', (t) => {
  async.parallel(
    {
      DOCUMENT_ROOT: partial(fn, 'env/DOCUMENT_ROOT.php'),
      PHP_SELF: partial(fn, 'env/PHP_SELF.php'),
      REQUEST_URI: partial(fn, 'env/REQUEST_URI.php'),
      SCRIPT_FILENAME: partial(fn, 'env/SCRIPT_FILENAME.php'),
      SCRIPT_NAME: partial(fn, 'env/SCRIPT_NAME.php'),
      SERVER_NAME: partial(fn, 'env/SERVER_NAME.php', {requestHost: 'sommerlaune.com:123'}),
      SERVER_PORT: partial(fn, 'env/SERVER_PORT.php', {requestHost: 'sommerlaune.com:123'}),
    },
    (err, data) => {
      t.falsy(err);
      t.is(data.DOCUMENT_ROOT, process.cwd());
      t.is(data.PHP_SELF, '/env/PHP_SELF.php');
      t.is(data.REQUEST_URI, '/env/REQUEST_URI.php');
      t.is(data.SCRIPT_FILENAME, path.join(process.cwd(), 'env/SCRIPT_FILENAME.php'));
      t.is(data.SCRIPT_NAME, '/env/SCRIPT_NAME.php');
      t.is(data.SERVER_NAME, 'sommerlaune.com');
      t.is(data.SERVER_PORT, '123');
      t.end();
    }
  );
});
