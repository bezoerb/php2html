import test from 'ava';
import fs from 'fs';
import nn from 'normalize-newline';
import fn from '../';

let read = (file, cb) => fs.readFile(file, 'utf-8', (err, data) => cb(nn(data)));

test.cb('generate phpinfo html', t =>
    fn('fixtures/info.php', (err, data) => {
        t.is(err, null);
        t.ok(/<title>phpinfo\(\)<\/title>/.test(nn(data)));
        t.ok(/<h1 class="p">PHP Version/.test(nn(data)));
        t.end()
    })
);

test.cb('generate index html', t =>
    fn('fixtures/index.php', (err, data) => {
        t.is(err, null);

        read('expected/index.html', (expected) => {
            t.is(nn(data), expected);
            t.end();
        });
    })
);

test.cb('consider "processLinks" option', t =>
    fn('fixtures/index.php', {processLinks: true}, (err, data) => {
        t.is(err, null);

        read('expected/index.processLinks.html', (expected) => {
            t.is(nn(data), expected);
            t.end();
        });
    })
);

test.cb('consider "processLinks" option', t =>
    fn('fixtures/get.php', {getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}}, (err, data) => {
        t.is(err, null);

        read('expected/get.html', (expected) => {
            t.is(nn(data), expected);
            t.end();
        });
    })
);

test.cb('use router script', t =>
    fn('/myroute', {router: 'fixtures/router.php'}, (err, data) => {
        t.is(err, null);
        t.is(nn(data),'/myroute')
        t.end();
    })
);

test.cb('use router script', t =>
    fn('/myroute', {router: 'fixtures/router.php'}, (err, data) => {
        t.is(err, null);
        t.is(nn(data),'/myroute')
        t.end();
    })
);

