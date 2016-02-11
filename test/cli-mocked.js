import test from 'ava';
import path from 'path';
import mockery from 'mockery';
import readPkg from 'read-package-json';
import fn from '../';

test.cb.beforeEach(t =>
    readPkg('../package.json', (err, pkg) => {
        t.context.origArgv = process.argv;
        t.context.origExit = process.exit;
        t.context.bin = '../' + pkg.bin.php2html;
        mockery.enable({
            warnOnUnregistered: false,
            useCleanCache: true
        });

        mockery.registerMock('./', (file, opts, cb) => {
            t.context.mockOpts = opts;
            cb(null, '');
        });
        t.end();
    })
);

test.afterEach(t => {
    mockery.resetCache();
    mockery.deregisterAll();
    mockery.disable();
    process.argv = t.context.origArgv;
    process.exit = t.context.origExit;
});

test('pass the correct opts when using short opts', t => {
    process.argv = [
        'node',
        path.resolve(t.context.bin),
        '/mocked',
        '-b', 'BASE',
        '-r', 'ROUTER',
        '-p', 'PROCESS',
        '-g', JSON.stringify({mocked: true})
    ];

    require(t.context.bin);

    t.is(t.context.mockOpts.baseDir, 'BASE');
    t.is(t.context.mockOpts.router, 'ROUTER');
    t.is(t.context.mockOpts.processLinks, 'PROCESS');
    t.is(t.context.mockOpts.getData.mocked, true);
});

test('pass the correct opts when using long opts', t => {
    process.argv = [
        'node',
        path.resolve(t.context.bin),
        '/mocked',
        '--baseDir', 'BASE',
        '--router', 'ROUTER',
        '--processLinks', 'PROCESS',
        '--getData', JSON.stringify({mocked: true})
    ];

    require(t.context.bin);

    t.is(t.context.mockOpts.baseDir, 'BASE');
    t.is(t.context.mockOpts.router, 'ROUTER');
    t.is(t.context.mockOpts.processLinks, 'PROCESS');
    t.is(t.context.mockOpts.getData.mocked, true);
});
