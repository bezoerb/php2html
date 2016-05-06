'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.default = 










































































































































































php2html;var _path = require('path');var _path2 = _interopRequireDefault(_path);var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);var _http = require('http');var _http2 = _interopRequireDefault(_http);var _connect = require('connect');var _connect2 = _interopRequireDefault(_connect);var _connectModrewrite = require('connect-modrewrite');var _connectModrewrite2 = _interopRequireDefault(_connectModrewrite);var _request = require('request');var _request2 = _interopRequireDefault(_request);var _gateway = require('gateway');var _gateway2 = _interopRequireDefault(_gateway);var _getPort = require('get-port');var _getPort2 = _interopRequireDefault(_getPort);var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);var _qs = require('qs');var _qs2 = _interopRequireDefault(_qs);var _shelljs = require('shelljs');var _shelljs2 = _interopRequireDefault(_shelljs);var _size = require('lodash/size');var _size2 = _interopRequireDefault(_size);var _defaults = require('lodash/defaults');var _defaults2 = _interopRequireDefault(_defaults);var _isObject = require('lodash/isObject');var _isObject2 = _interopRequireDefault(_isObject);var _isFunction = require('lodash/isFunction');var _isFunction2 = _interopRequireDefault(_isFunction);var _bluebird = require('bluebird');var _bluebird2 = _interopRequireDefault(_bluebird);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}var debug = (0, _debug2.default)('php2html:core');var host = '127.0.0.1'; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * Get configured port or free port
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           * @param {object} opts options passed to php2html
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           */var fetchPort = function fetchPort(opts) {return opts.port ? new _bluebird2.default(function (resolve) {return resolve(opts.port);}) : (0, _getPort2.default)();}; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 * Compute URI for gateway relative to docroot
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 * @param {string} docroot
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 * @param {string} file
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 * @param {bool} strict
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 * @returns {string}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 */var getUri = function getUri(docroot, file, strict) {var win32 = process.platform === 'win32';var uri = void 0;if (strict) {var stat = _fs2.default.statSync(file); // If file ends with a slash apend index file
        if (stat.isDirectory()) {file = _path2.default.join(file, 'index.php');} // absolutize
        file = _path2.default.resolve(file);}if (win32) {// use the correct slashes for uri
        uri = file.replace(docroot, '').replace(/[\\]/g, '/');} else {uri = file.replace(docroot, '');} // ensure that we have an absolute url
    if (uri.substr(0, 1) !== '/') {uri = '/' + uri;}return uri;}; /**
                                                                   * Get connect app
                                                                   * @param {object} opts options hash passed to php2html
                                                                   */var getConnect = function getConnect(opts) {var app = (0, _connect2.default)(); // rewrite requests to router if applicable
    if (opts.router) {try {var router = getUri(opts.baseDir, opts.router, true);debug('Router script:', opts.router);debug('Router rewrite:', '^(.*)$ ' + router);app.use((0, _connectModrewrite2.default)(['^(.*)$ ' + router]));} catch (err) {debug('ERROR:', err.message);return new _bluebird2.default(function (resolve, reject) {return reject(err);});}}if (opts.requestHost) {app.use(function (req, res, next) {req.headers.host = opts.requestHost.replace(/^https?:\/\//, '');next();});}app.use((0, _gateway2.default)(opts.baseDir, { '.php': 'php-cgi' }));return app;}; /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         * Fetch html from
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         * @param url
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         * @param opts
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         */var fetchHtml = function fetchHtml(url, opts) {return new _bluebird2.default(function (resolve, reject) {(0, _request2.default)(url, function (error, response, body) {// request failed
            if (error) {return reject(error);}if (response.statusCode >= 400) {var message = response.statusCode + ' - ' + response.statusMessage;return reject(new Error(message));} // 204 No Content
            if (!body) {return reject(new Error('204 - No Content'));} // replace relative php links with corresponding html link
            if (body && opts.processLinks) {var linkRegex = /href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm;(body.match(linkRegex) || []).forEach(function (link) {if (link.match(/:\/\//)) {return;}var hlink = link.replace(/(\w)\.php([^\w])/g, '$1.html$2');body = body.replace(link, hlink);});}resolve(body);}).end();});};function compile(file, opts) {// check php-cgi dependency
    if (!_shelljs2.default.which('php-cgi')) {return new _bluebird2.default(function (resolve, reject) {return reject(new Error('"php-cgi" not found. See https://git.io/vg20U'));});} // check file
    if (!file) {return new _bluebird2.default(function (resolve, reject) {return reject(new Error('Missing input'));});}return fetchPort(opts).then(function (port) {return new _bluebird2.default(function (resolve, reject) {var app = getConnect(opts);var server = _http2.default.createServer(app).listen(port).on('error', reject).on('listening', function () {return resolve({ server: server, port: port });});});}).then(function (_ref) {var server = _ref.server;var port = _ref.port;var uri = getUri(opts.baseDir, file, !opts.router);var url = 'http://' + host + ':' + port + uri;if ((0, _isObject2.default)(opts.getData) && (0, _size2.default)(opts.getData)) {url += '?' + _qs2.default.stringify(opts.getData);}return { server: server, url: url };}).then(function (_ref2) {var server = _ref2.server;var url = _ref2.url;return fetchHtml(url, opts).finally(function () {return server.close();});});}function php2html(file, opts, cb) {if ((0, _isFunction2.default)(opts) && !cb) {cb = opts;opts = {};}var options = (0, _defaults2.default)(opts || {}, { processLinks: false, getData: {}, baseDir: process.cwd() });options.baseDir = _path2.default.resolve(options.baseDir);var corePromise = compile(file, options);if ((0, _isFunction2.default)(cb)) {corePromise.catch(function (err) {cb(err);throw new _bluebird2.default.CancellationError();}).then(function (output) {cb(null, output.toString());}).catch(_bluebird2.default.CancellationError, function () {});} else {return corePromise;}}