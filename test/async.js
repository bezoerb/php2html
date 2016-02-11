import test from 'ava';
import path from 'path';
import partial from 'lodash/function/partial';
import async from 'async';
import fn from '../';

test.cb('handle multiple parallel calls', t =>
    async.parallel({
        DOCUMENT_ROOT: partial(fn, 'env/DOCUMENT_ROOT.php'),
        PHP_SELF: partial(fn, 'env/PHP_SELF.php'),
        REQUEST_URI: partial(fn, 'env/REQUEST_URI.php'),
        SCRIPT_FILENAME: partial(fn, 'env/SCRIPT_FILENAME.php'),
        SCRIPT_NAME: partial(fn, 'env/SCRIPT_NAME.php')
    }, (err, data) => {
        t.notOk(err);
        t.is(data.DOCUMENT_ROOT, process.cwd());
        t.is(data.PHP_SELF, '/env/PHP_SELF.php');
        t.is(data.REQUEST_URI, '/env/REQUEST_URI.php');
        t.is(data.SCRIPT_FILENAME, path.join(process.cwd(), 'env/SCRIPT_FILENAME.php'));
        t.is(data.SCRIPT_NAME, '/env/SCRIPT_NAME.php');
        t.end();
    })
);
