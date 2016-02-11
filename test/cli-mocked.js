import test from 'ava';
import path from 'path';
import mockery from 'mockery';
import Promise from 'Bluebird';
import 'babel-core/register';

test.beforeEach(t => {
    t.context.origArgv = process.argv;
    t.context.origExit = process.exit;
    t.context.bin = '../src/cli.js';
    mockery.enable({
        warnOnUnregistered: false,
        useCleanCache: true
    });

    mockery.registerMock('./', (file, opts) => {
        t.context.mockOpts = opts;
        return new Promise(resolve => resolve(''));
    });
});

test.afterEach(t => {
    mockery.resetCache();
    mockery.deregisterAll();
    mockery.disable();
    process.argv = t.context.origArgv;
    process.exit = t.context.origExit;
});

test.serial('pass the correct opts when using short opts', t => {
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

test.serial('pass the correct opts when using long opts', t => {
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
