const path = require('path');
const fs = require('fs');
const http = require('http');
const connect = require('connect');
const modRewrite = require('connect-modrewrite');
const request = require('request');
const gateway = require('gateway');
const getPort = require('get-port');
const debugFn = require('debug');
const qs = require('qs');
const shell = require('shelljs');

const size = require('lodash/size');
const defaults = require('lodash/defaults');
const isObject = require('lodash/isObject');
const isFunction = require('lodash/isFunction');
const Bluebird = require('bluebird');

const debug = debugFn('php2html:core');

const host = '127.0.0.1';

/**
 * Get configured port or free port
 * @param {object} opts options passed to php2html
 * @returns {int} Free port
 */
const fetchPort = opts => (opts.port ? new Bluebird(resolve => resolve(opts.port)) : getPort());

/**
 * Compute URI for gateway relative to docroot
 * @param {string} docroot Document root
 * @param {string} file Filename
 * @param {bool} strict Strict mode
 * @returns {string} Uri
 */
const getUri = (docroot, file, strict) => {
  const win32 = process.platform === 'win32';
  let uri;

  if (strict) {
    const stat = fs.statSync(file);
    // If file ends with a slash apend index file
    if (stat.isDirectory()) {
      file = path.join(file, 'index.php');
    }

    // Absolutize
    file = path.resolve(file);
  }

  if (win32) {
    // Use the correct slashes for uri
    uri = file.replace(docroot, '').replace(/[\\]/g, '/');
  } else {
    uri = file.replace(docroot, '');
  }

  // Ensure that we have an absolute url
  if (uri.substr(0, 1) !== '/') {
    uri = '/' + uri;
  }

  return uri;
};

/**
 * Get connect app
 * @param {object} opts options hash passed to php2html
 * @returns {object} connect app
 */
const getConnect = opts => {
  const app = connect();

  // Rewrite requests to router if applicable
  if (opts.router) {
    try {
      const router = getUri(opts.baseDir, opts.router, true);

      debug('Router script:', opts.router);
      debug('Router rewrite:', '^(.*)$ ' + router);
      app.use(modRewrite(['^(.*)$ ' + router]));
    } catch (error) {
      debug('ERROR:', error.message);
      return new Bluebird((resolve, reject) => reject(error));
    }
  }

  if (opts.requestHost) {
    app.use((req, res, next) => {
      req.headers.host = opts.requestHost.replace(/^https?:\/\//, '');
      next();
    });
  }

  app.use(
    gateway(opts.baseDir, {
      '.php': 'php-cgi',
    })
  );

  return app;
};

/**
 * Fetch html from
 * @param {string} url Url
 * @param {object} opts Options
 * @returns {Promise} Request promise resolves with response string
 */
const fetchHtml = (url, opts) =>
  new Bluebird((resolve, reject) => {
    request(url, (error, response, body) => {
      // Request failed
      if (error) {
        return reject(error);
      }

      if (response.statusCode >= 400) {
        const message = response.statusCode + ' - ' + response.statusMessage;
        return reject(new Error(message));
      }

      // 204 No Content
      if (!body) {
        return reject(new Error('204 - No Content'));
      }

      // Replace relative php links with corresponding html link
      if (body && opts.processLinks) {
        const linkRegex = /href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm;
        (body.match(linkRegex) || []).forEach(link => {
          if (link.match(/:\/\//)) {
            return;
          }
          const hlink = link.replace(/(\w)\.php([^\w])/g, '$1.html$2');

          body = body.replace(link, hlink);
        });
      }
      resolve(body);
    }).end();
  });

function compile(file, opts) {
  // Check php-cgi dependency
  if (!shell.which('php-cgi')) {
    return new Bluebird((resolve, reject) => reject(new Error('"php-cgi" not found. See https://git.io/vg20U')));
  }

  // Check file
  if (!file) {
    return new Bluebird((resolve, reject) => reject(new Error('Missing input')));
  }

  return fetchPort(opts)
    .then(
      port =>
        new Bluebird((resolve, reject) => {
          const app = getConnect(opts);
          const server = http
            .createServer(app)
            .listen(port)
            .on('error', reject)
            .on('listening', () => resolve({server, port}));
        })
    )
    .then(({server, port}) => {
      const uri = getUri(opts.baseDir, file, !opts.router);
      let url = 'http://' + host + ':' + port + uri;
      if (isObject(opts.getData) && size(opts.getData)) {
        url += '?' + qs.stringify(opts.getData);
      }
      return {server, url};
    })
    .then(({server, url}) => fetchHtml(url, opts).finally(() => server.close()));
}

function php2html(file, opts, cb) {
  if (isFunction(opts) && !cb) {
    cb = opts;
    opts = {};
  }

  const options = defaults(opts || {}, {
    processLinks: false,
    getData: {},
    baseDir: process.cwd(),
  });

  options.baseDir = path.resolve(options.baseDir);

  const corePromise = compile(file, options);

  if (isFunction(cb)) {
    // eslint-disable-next-line promise/valid-params
    corePromise
      .catch(error => {
        cb(error);
        throw new Bluebird.CancellationError();
      })
      .then(output => {
        cb(null, output.toString());
      })
      .catch(Bluebird.CancellationError, () => {});
  } else {
    return corePromise;
  }
}

module.exports = php2html;
