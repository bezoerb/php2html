import path from 'path';
import http from 'http';
import connect from 'connect';
import modRewrite from 'connect-modrewrite';
import request from 'request';
import gateway from 'gateway';
import getPort from 'get-port';
import debugFn from 'debug';
import qs from 'qs';
import fs from 'fs';
import shell from 'shelljs';

import size from 'lodash/size';
import defaults from 'lodash/defaults';
import isObject from 'lodash/isObject';
import isFunction from 'lodash/isFunction';
import Promise from 'bluebird';

let debug = debugFn('php2html:core');

const host = '127.0.0.1';

/**
 * Get configured port or free port
 * @param {object} opts options passed to php2html
 */
let fetchPort = opts => opts.port ? new Promise(resolve => resolve(opts.port)) : getPort();

/**
 * Compute URI for gateway relative to docroot
 * @param {string} docroot
 * @param {string} file
 * @param {bool} strict
 * @returns {string}
 */
let getUri = (docroot, file, strict) => {
    let win32 = process.platform === 'win32';
    let uri;

    if (strict) {
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

/**
 * Get connect app
 * @param {object} opts options hash passed to php2html
 */
let getConnect = opts => {
    let app = connect();

    // rewrite requests to router if applicable
    if (opts.router) {
        try {
            var router = getUri(opts.baseDir, opts.router, true);

            debug('Router script:', opts.router);
            debug('Router rewrite:', '^(.*)$ ' + router);
            app.use(modRewrite([
                '^(.*)$ ' + router
            ]));
        } catch (err) {
            debug('ERROR:', err.message);
            return new Promise((resolve, reject) => reject(err));
        }
    }

    if (opts.requestHost) {
        app.use((req, res, next) => {
            req.headers.host = opts.requestHost.replace(/^https?:\/\//, '');
            next();
        });
    }

    app.use(gateway(opts.baseDir, {
        '.php': 'php-cgi'
    }));

    return app;
};

/**
 * Fetch html from
 * @param url
 * @param opts
 */
let fetchHtml = (url, opts) => new Promise((resolve, reject) => {
    request(url, function (error, response, body) {
        // request failed
        if (error) {
            return reject(error);
        }

        if (response.statusCode >= 400) {
            var message = response.statusCode + ' - ' + response.statusMessage;
            return reject(new Error(message));
        }

        // 204 No Content
        if (!body) {
            return reject(new Error('204 - No Content'));
        }

        // replace relative php links with corresponding html link
        if (body && opts.processLinks) {
            let linkRegex = /href=['"]([^'"]+\.php(?:\?[^'"]*)?)['"]/gm;
            (body.match(linkRegex) || []).forEach(link => {
                if (link.match(/:\/\//)) {
                    return;
                }
                var hlink = link.replace(/(\w)\.php([^\w])/g, '$1.html$2');

                body = body.replace(link, hlink);
            });
        }
        resolve(body);
    }).end();
});

function compile(file, opts) {
    // check php-cgi dependency
    if (!shell.which('php-cgi')) {
        return new Promise((resolve, reject) => reject(new Error('"php-cgi" not found. See https://git.io/vg20U')));
    }

    // check file
    if (!file) {
        return new Promise((resolve, reject) => reject(new Error('Missing input')));
    }

    return fetchPort(opts)
        .then(port => new Promise((resolve, reject) => {
            let app = getConnect(opts);
            let server = http.createServer(app).listen(port)
                .on('error', reject)
                .on('listening', () => resolve({server: server, port: port}));
        }))
        .then(({server, port}) => {
            var uri = getUri(opts.baseDir, file, !opts.router);
            var url = 'http://' + host + ':' + port + uri;
            if (isObject(opts.getData) && size(opts.getData)) {
                url += '?' + qs.stringify(opts.getData);
            }
            return {server: server, url: url};
        })
        .then(({server, url}) =>
            fetchHtml(url, opts).finally(() => server.close())
        );
}

export default function php2html(file, opts, cb) {
    if (isFunction(opts) && !cb) {
        cb = opts;
        opts = {};
    }

    let options = defaults(opts || {}, {
        processLinks: false,
        getData: {},
        baseDir: process.cwd()
    });

    options.baseDir = path.resolve(options.baseDir);

    let corePromise = compile(file, options);

    if (isFunction(cb)) {
        corePromise.catch(err => {
            cb(err);
            throw new Promise.CancellationError();
        }).then(output => {
            cb(null, output.toString());
        }).catch(Promise.CancellationError, () => {
        });
    } else {
        return corePromise;
    }
}
