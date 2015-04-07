'use strict';
var path = require('path');
var http = require('http');
var connect = require('connect');
var modRewrite = require('connect-modrewrite');
var request = require('request');
var gateway = require('gateway');
var getPort = require('get-port');
var qs = require('qs');
var _ = require('lodash');
var fs = require('fs');
var win32 = process.platform === 'win32';


module.exports = function (file, opts, cb) {
	if (_.isFunction(opts) && !cb) {
		cb = opts;
		opts = {};
	}

	if (!cb) {
		cb = function () {};
	}
	var host = '127.0.0.1';
	var app = connect();
	var options = _.defaults(opts || {}, {
		processLinks: false,
		getData: {},
		baseDir: process.cwd()
	});

	if (!file) {
		cb(new Error('Missing input'));
		return;
	}


	options.baseDir = path.resolve(options.baseDir);

	/**
	 * Compute URI for gateway relative to docroot
	 * @param {string} docroot
	 * @param {string} file
	 * @returns {string}
	 */
	var computeUri = function (docroot, file) {
		var uri;

		if (!options.router) {
			var stat = fs.statSync(file);
			// If file ends with a slash apend index file
			if (stat.isDirectory()) {
				file = path.join(file, 'index.php');
			}

			// absolutize
			file = path.resolve(file);
		}




		if (win32) {
			// use the correct slashes for uri
			uri = file.replace(docroot, '').replace(/[\\]/g, '/');
		} else {
			uri = file.replace(docroot, '');
		}

		// ensure that we have an absolute url
		if (uri.substr(0, 1) !== '/') {
			uri = '/' + uri;
		}

		return uri;
	};


	// rewrite requests to router if set
	if (options.router) {
		try {
			var router = computeUri(options.baseDir, options.router);
			app.use(modRewrite([
				'^(.*)$ ' + router
			]));
		} catch (err) {
			cb(err);
		}
	}

	app.use(gateway(options.baseDir, {
		'.php': 'php-cgi'
	}));


	getPort(function (err, port) {

		var server = http.createServer(app).listen(port, function () {
			var url;
			try {
				var uri = computeUri(options.baseDir, file);
				url = 'http://' + host + ':' + port + uri;

			} catch (err) {
				cb(err);
				return;
			}

			// $_GET data
			if (_.isObject(options.getData) && _.size(options.getData)) {
				url += '?' + qs.stringify(options.getData);
			}

			request(url, function (error, response, body) {

				// request failed
				if (error) {
					server.close(function () {
						cb(error);
					});
					return;
				}

				// 204 No Content
				if (!body) {
					server.close(function () {
						cb(new Error('204 - No Content'));
					});

					// everything went right
				} else {

					// replace relative php links with corresponding html link
					if (body && options.processLinks) {
						_.forEach(body.match(/href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm), function (link) {
							if (link.match(/:\/\//)) {
								return;
							}
							var hlink = link.replace(/(\w)\.php([^\w])/g, '$1.html$2');

							body = body.replace(link, hlink);
						});
					}
					server.close(function () {
						cb(null, body);
					});
				}
			}).end();
		});
	});
};
