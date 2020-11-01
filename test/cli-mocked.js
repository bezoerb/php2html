const path = require('path');
const test = require('ava');
const mockery = require('mockery');

process.chdir(__dirname);

test.beforeEach((t) => {
  t.context.origArgv = process.argv;
  t.context.origExit = process.exit;
  t.context.bin = '../cli.js';
  mockery.enable({
    warnOnUnregistered: false,
    useCleanCache: true,
  });

  mockery.registerMock('.', (file, options) => {
    t.context.mockOpts = options;
    return Promise.resolve('');
  });
});

test.afterEach((t) => {
  mockery.resetCache();
  mockery.deregisterAll();
  mockery.disable();
  process.argv = t.context.origArgv;
  process.exit = t.context.origExit;
});

test.serial('pass the correct opts when using short opts', (t) => {
  process.argv = [
    'node',
    path.resolve(t.context.bin),
    '/mocked',
    '-b',
    'BASE',
    '-r',
    'ROUTER',
    '-p',
    '-g',
    JSON.stringify({mocked: true}),
  ];

  require(t.context.bin);

  t.is(t.context.mockOpts.baseDir, 'BASE');
  t.is(t.context.mockOpts.router, 'ROUTER');
  t.is(t.context.mockOpts.processLinks, true);
  t.is(t.context.mockOpts.getData.mocked, true);
});

test.serial('pass the correct opts when using long opts', (t) => {
  process.argv = [
    'node',
    path.resolve(t.context.bin),
    '/mocked',
    '--baseDir',
    'BASE',
    '--router',
    'ROUTER',
    '--processLinks',
    '--getData',
    JSON.stringify({mocked: true}),
  ];

  require(t.context.bin);

  t.is(t.context.mockOpts.baseDir, 'BASE');
  t.is(t.context.mockOpts.router, 'ROUTER');
  t.is(t.context.mockOpts.processLinks, true);
  t.is(t.context.mockOpts.getData.mocked, true);
});
