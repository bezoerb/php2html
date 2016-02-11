import test from 'ava';
import fn from '../';

test.cb('fail without input', t =>
    fn(undefined, (err, data) => {
        t.is(data,undefined);
        t.ok(err && err.message);
        t.is(err.message, 'Missing input');
        t.end()
    })
);

test.cb('fail on missing file', t =>
    fn('missing', (err, data)  => {
        t.is(data,undefined);
        t.ok(err && err.message);
        t.ok(/ENOENT/.test(err.message));
        t.ok(/no such file or directory/.test(err.message));
        t.end()
    })
);

test.cb('fail on empty file', t =>
    fn('fixtures/empty.php', (err, data)  => {
        /* jshint expr: true */
        t.notOk(data);
        t.ok(err && err.message);
        t.is(err.message, '204 - No Content');
        t.end();
    })
);


test.cb('fail on unprocessable files', t =>
    fn('fixtures/nophp.txt', (err, data)  => {
        /* jshint expr: true */
        t.notOk(data);
        t.ok(err && err.message);
        t.end();
    })
);
