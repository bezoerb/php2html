const fs = require('fs');
const path = require('path');
const test = require('ava');
const execa = require('execa');
const readPkgUp = require('read-pkg-up');
const nn = require('normalize-newline');

process.chdir(path.resolve(__dirname));

const read = (file) =>
  new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, file), 'utf-8', (error, data) => {
      if (error) {
        reject(error);
      }

      resolve(nn(data));
    });
  });

const getBin = async () => {
  const {packageJson: pkg} = await readPkgUp();
  return path.join(__dirname, '../', pkg.bin.php2html);
};

const run = async (args = []) => {
  const bin = await getBin();
  return execa('node', [bin, ...args]);
};

const pipe = async (cmd) => {
  const bin = await getBin();
  return execa(`${cmd} | node ${bin}`, {shell: true});
};

test('return the version', async (t) => {
  const {packageJson: pkg} = await readPkgUp();
  const {stderr, stdout} = await run(['--version', '--no-update-notifier']);
  t.falsy(stderr);
  t.is(stdout.replace(/\r\n|\n/g, ''), pkg.version);
});

test('work well with the php file passed as an option', async (t) => {
  const expected = await read('expected/index.html');
  const {stderr, stdout} = await run(['fixtures/index.php']);
  t.falsy(stderr);
  t.is(nn(`${stdout}\r\n`), expected);
});

test('work well with the php file piped to php2html', async (t) => {
  const {stderr, stdout} = await pipe('cat fixtures/info.php');
  t.falsy(stderr);
  t.regex(nn(stdout), /<title>.*phpinfo\(\).*<\/title>/);
});

test('fail if the piped file contains "__FILE__" or "__DIR__"', async (t) => {
  t.plan(3);
  try {
    await pipe('cat fixtures/index.php');
  } catch (error) {
    t.falsy(error.stdout);
    t.truthy(error.stderr);
    t.regex(error.stderr, /Error: "__FILE__" detected. This can't be resolved for piped content./);
  }
});
