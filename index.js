import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';
import connect from 'connect';
import modRewrite from 'connect-modrewrite';
import request from 'request';
import gateway from 'gateway';
import getPort from 'get-port';
import debugFn from 'debug';
import qs from 'qs';
import shell from 'shelljs';

import size from 'lodash/size.js';
import defaults from 'lodash/defaults.js';
import isObject from 'lodash/isObject.js';
import isFunction from 'lodash/isFunction.js';
import Bluebird from 'bluebird';

const debug = debugFn('php2html:core');

const host = '127.0.0.1';

/**
 * Get configured port or free port
 * @param {object} opts options passed to php2html
 * @returns {int} Free port
 */
const fetchPort = (options) => (options.port ? new Bluebird((resolve) => resolve(options.port)) : getPort());

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

  uri = win32 ? file.replace(docroot, '').replace(/\\/g, '/') : file.replace(docroot, '');

  // Ensure that we have an absolute url
  if (!uri.startsWith('/')) {
    uri = '/' + uri;
  }

  return uri;
};

/**
 * Get connect app
 * @param {object} opts options hash passed to php2html
 * @returns {object} connect app
 */
const getConnect = (options) => {
  const app = connect();

  // Rewrite requests to router if applicable
  if (options.router) {
    try {
      const router = getUri(options.baseDir, options.router, true);

      debug('Router script:', options.router);
      debug('Router rewrite:', '^(.*)$ ' + router);
      app.use(modRewrite(['^(.*)$ ' + router]));
    } catch (error) {
      debug('ERROR:', error.message);
      return new Bluebird((resolve, reject) => reject(error));
    }
  }

  if (options.requestHost) {
    app.use((request_, response, next) => {
      request_.headers.host = options.requestHost.replace(/^https?:\/\//, '');
      next();
    });
  }

  app.use(
    gateway(options.baseDir, {
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
const fetchHtml = (url, options) =>
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
      if (body && options.processLinks) {
        const linkRegex = /href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm;
        for (const link of body.match(linkRegex) || []) {
          if (/:\/\//.test(link)) {
            continue;
          }

          const hlink = link.replace(/(\w)\.php(\W)/g, '$1.html$2');

          body = body.replace(link, hlink);
        }
      }

      resolve(body);
    }).end();
  });

function compile(file, options) {
  // Check php-cgi dependency
  if (!shell.which('php-cgi')) {
    return new Bluebird((resolve, reject) => reject(new Error('"php-cgi" not found. See https://git.io/vg20U')));
  }

  // Check file
  if (!file) {
    return new Bluebird((resolve, reject) => reject(new Error('Missing input')));
  }

  return fetchPort(options)
    .then(
      (port) =>
        new Bluebird((resolve, reject) => {
          const app = getConnect(options);
          const server = http
            .createServer(app)
            .listen(port)
            .on('error', reject)
            .on('listening', () => resolve({server, port}));
        })
    )
    .then(({server, port}) => {
      const uri = getUri(options.baseDir, file, !options.router);
      let url = 'http://' + host + ':' + port + uri;
      if (isObject(options.getData) && size(options.getData)) {
        url += '?' + qs.stringify(options.getData);
      }

      return {server, url};
    })
    .then(({server, url}) => fetchHtml(url, options).finally(() => server.close()));
}

export function php2html(file, options_, cb) {
  if (isFunction(options_) && !cb) {
    cb = options_;
    options_ = {};
  }

  const options = defaults(options_ || {}, {
    processLinks: false,
    getData: {},
    baseDir: process.cwd(),
  });

  options.baseDir = path.resolve(options.baseDir);

  const corePromise = compile(file, options);

  if (isFunction(cb)) {
    // eslint-disable-next-line promise/valid-params
    corePromise
      .catch((error) => {
        cb(error);
        throw new Bluebird.CancellationError();
      })
      .then((output) => {
        cb(null, output.toString());
      })
      .catch(Bluebird.CancellationError, () => {});
  } else {
    return corePromise;
  }
}

export default php2html;
