'use strict';
var expect = require('chai').expect;
var path = require('path');
var php2html = require('../');
var fs = require('fs');

process.chdir(path.resolve(__dirname));
process.setMaxListeners(0);

function read(file) {
	return fs.readFileSync(file, 'utf-8');
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
				expect(error.message).to.eql('ENOENT, no such file or directory \'nothing\'');
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
	});

	describe('without errors', function () {

		it('should generate phpinfo html', function (done) {
			php2html('fixtures/info.php', function (error, data) {
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(data).to.contain('<title>phpinfo()</title>');
				expect(data).to.contain('<h1 class="p">PHP Version');
				done();
			});
		});

		it('should generate index html', function (done) {
			php2html('fixtures/index.php', function (error, data) {
				/* jshint expr: true */
				expect(error).to.be.null;
				expect(data).to.eql(read('expected/index.html'));
				done();
			});
		});

		it('should consider "processLinks" option', function (done) {
			php2html('fixtures/index.php', {processLinks: true},
				function (error, data) {
					/* jshint expr: true */
					expect(error).to.not.exist;
					expect(data).to.eql(read('expected/index.processLinks.html'));
					done();
				});
		});

		it('should process $_GET data', function (done) {
			php2html('fixtures/get.php', {
				getData: {test: 42, arr: [1, 2, 3, 4], obj: {a: 1, b: 2, c: 3}}
			}, function (error, data) {
				/* jshint expr: true */
				expect(error).to.not.exist;
				expect(data).to.eql(read('expected/get.html'));
				done();
			});

		});

		it('should use router script', function (done) {
			php2html('/myroute', {
				router: 'fixtures/router.php'
			}, function (error, data) {
				/* jshint expr: true */
				expect(error).to.not.exist;

				expect(data).to.eql('/myroute');
				done();
			});

		});
	});

});
