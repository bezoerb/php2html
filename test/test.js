'use strict';
var expect = require('chai').expect;
var path = require('path');
var php2html = require('../');
var fs = require('fs');
var _ = require('lodash');
var exec = require('child_process').exec;
var async = require('async');
var mockery = require('mockery');
var normalizeNewline = require('normalize-newline');
var pkg = require('../package.json');
var execFile = require('child_process').execFile;

var skipWin = process.platform === 'win32'? it.skip : it;

process.chdir(path.resolve(__dirname));
process.setMaxListeners(0);

function read(file) {
	return normalizeNewline(fs.readFileSync(file, 'utf-8'));
}


describe('Module', function () {

	describe('errors', function () {
		it('should fail without input', function (done) {
			php2html(undefined, function (error, data) {
				var expected = new Error('Missing input');
				/* jshint expr: true */
				expect(data).to.not.exist;
				expect(error).to.eql(expected);
				done();
			});
		});
		it('should fail on missing file', function (done) {
			php2html('nothing', function (error, data) {
				/* jshint expr: true */
				expect(data).to.not.exist;
				expect(error.message).to.contain('ENOENT');
				expect(error.message).to.contain('no such file or directory');
				done();
			});
		});

		it('should fail on empty file', function (done) {
			php2html('fixtures/empty.php', function (error, data) {
				var expected = new Error('204 - No Content');
				/* jshint expr: true */
				expect(data).to.not.exist;
				expect(error).to.eql(expected);
				done();
			});
		});

		it('should fail on unprocessable files', function (done) {
			php2html('fixtures/nophp.txt', function (error, data) {
				/* jshint expr: true */
				expect(data).to.not.exist;
				/* jshint expr: true */
				expect(error).to.exist;
				done();
			});
		});
	});

	describe('without errors', function () {

		it('should generate phpinfo html', function (done) {
			php2html('fixtures/info.php', function (error, data) {
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(normalizeNewline(data)).to.contain('<title>phpinfo()</title>');
				expect(normalizeNewline(data)).to.contain('<h1 class="p">PHP Version');
				done();
			});
		});

		it('should generate index html', function (done) {
			php2html('fixtures/index.php', function (error, data) {
				/* jshint expr: true */
				expect(error).to.be.null;
				expect(normalizeNewline(data)).to.eql(read('expected/index.html'));
				done();
			});
		});

		it('should consider "processLinks" option', function (done) {
			php2html('fixtures/index.php', {processLinks: true},
				function (error, data) {
					/* jshint expr: true */
					expect(error).to.not.exist;
					expect(normalizeNewline(data)).to.eql(read('expected/index.processLinks.html'));
					done();
				});
		});

		it('should process $_GET data', function (done) {
			php2html('fixtures/get.php', {
				getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}
			}, function (error, data) {
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(normalizeNewline(data)).to.eql(read('expected/get.html'));
				done();
			});

		});

		it('should use router script', function (done) {
			php2html('/myroute', {
				router: 'fixtures/router.php'
			}, function (error, data) {
				/* jshint expr: true */
				expect(error).to.not.exist;

				expect(normalizeNewline(data)).to.eql('/myroute');
				done();
			});

		});

		it('should handle multiple parallel calls', function (done) {
			async.parallel({
				DOCUMENT_ROOT: _.partial(php2html, 'env/DOCUMENT_ROOT.php'),
				PHP_SELF: _.partial(php2html, 'env/PHP_SELF.php'),
				REQUEST_URI: _.partial(php2html, 'env/REQUEST_URI.php'),
				SCRIPT_FILENAME: _.partial(php2html, 'env/SCRIPT_FILENAME.php'),
				SCRIPT_NAME: _.partial(php2html, 'env/SCRIPT_NAME.php')
			}, function (err, results) {
				expect(results.DOCUMENT_ROOT).to.eql(process.cwd());
				expect(results.PHP_SELF).to.eql('/env/PHP_SELF.php');
				expect(results.REQUEST_URI).to.eql('/env/REQUEST_URI.php');
				expect(results.SCRIPT_FILENAME).to.eql(path.join(process.cwd(), 'env/SCRIPT_FILENAME.php'));
				expect(results.SCRIPT_NAME).to.eql('/env/SCRIPT_NAME.php');
				done();
			});
		});
	});
});


describe('CLI', function () {
	describe('mocked', function () {
		beforeEach(function () {
			this.origArgv = process.argv;
			this.origExit = process.exit;

			mockery.enable({
				warnOnUnregistered: false,
				useCleanCache: true
			});

			mockery.registerMock('./', function (file, opts, cb) {
				this.mockOpts = opts;
				cb(null, '');
			}.bind(this));
		});

		afterEach(function () {
			mockery.resetCache();
			mockery.deregisterAll();
			mockery.disable();
			process.argv = this.origArgv;
			process.exit = this.origExit;
		});

		it('should pass the correct opts when using short opts', function () {
			process.argv = [
				'node',
				path.join(__dirname, '../', pkg.bin.php2html),
				'/mocked',
				'-b', 'BASE',
				'-r', 'ROUTER',
				'-p', 'PROCESS',
				'-g', JSON.stringify({mocked: true})
			];

			require('../cli');

			expect(this.mockOpts.baseDir).to.eql('BASE');
			expect(this.mockOpts.router).to.eql('ROUTER');
			expect(this.mockOpts.processLinks).to.eql('PROCESS');
			expect(this.mockOpts.getData).to.eql({mocked: true});
		});

		it('should pass the correct opts when using long opts', function () {
			process.argv = [
				'node',
				path.join(__dirname, '../', pkg.bin.php2html),
				'/mocked',
				'--baseDir', 'BASE',
				'--router', 'ROUTER',
				'--processLinks', 'PROCESS',
				'--getData', JSON.stringify({mocked: true})
			];

			require('../cli');

			expect(this.mockOpts.baseDir).to.eql('BASE');
			expect(this.mockOpts.router).to.eql('ROUTER');
			expect(this.mockOpts.processLinks).to.eql('PROCESS');
			expect(this.mockOpts.getData).to.eql({mocked: true});
		});
	});


	describe('shell calls', function () {
		// seems to time out
		it('should return the version', function (done) {
			execFile('node', [path.join(__dirname, '../', pkg.bin.php2html), '--version', '--no-update-notifier'], function(error, stdout){
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(stdout.replace(/\r\n|\n/g, '')).to.eql(pkg.version);
				done();
			});
		});

		it('should work well with the php file passed as an option', function (done) {
			execFile('node', [
				path.join(__dirname, '../', pkg.bin.php2html),
				'fixtures/index.php'
			], function (error, stdout) {
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(normalizeNewline(stdout)).to.eql(read('expected/index.html'));
				done();
			});
		});

		// no "cat" available for windows
		skipWin('should work well with the php file piped to php2html', function (done) {
			exec('cat fixtures/info.php | node ' + path.join(__dirname, '../', pkg.bin.php2html), function (error, stdout) {
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(stdout).to.contain('<title>phpinfo()</title>');
				expect(stdout).to.contain('<h1 class="p">PHP Version');
				done();
			});
		});

		// no "cat" available for windows
		skipWin('should fail if the piped file contains "__FILE__" or "__DIR__"', function (done) {
			exec('cat fixtures/index.php | node ' + path.join(__dirname, '../', pkg.bin.php2html), function (error) {
				expect(error.message).to.contain('Error: "__FILE__" detected. This can\'t be resolved for piped content.');
				done();
			});
		});

	});
});
