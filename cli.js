#!/usr/bin/env node
'use strict';


var _os = require('os');var _os2 = _interopRequireDefault(_os);
var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);
var _path = require('path');var _path2 = _interopRequireDefault(_path);
var _meow = require('meow');var _meow2 = _interopRequireDefault(_meow);
var _chalk = require('chalk');var _chalk2 = _interopRequireDefault(_chalk);
var _indentString = require('indent-string');var _indentString2 = _interopRequireDefault(_indentString);
var _getStdin = require('get-stdin');var _getStdin2 = _interopRequireDefault(_getStdin);
var _tail = require('lodash/tail');var _tail2 = _interopRequireDefault(_tail);
var _compact = require('lodash/compact');var _compact2 = _interopRequireDefault(_compact);
var _reduce = require('lodash/reduce');var _reduce2 = _interopRequireDefault(_reduce);
var _readPkgUp = require('read-pkg-up');var _readPkgUp2 = _interopRequireDefault(_readPkgUp);
var _tmp = require('tmp');var _tmp2 = _interopRequireDefault(_tmp);
var _updateNotifier = require('update-notifier');var _updateNotifier2 = _interopRequireDefault(_updateNotifier);
var _ = require('./');var _2 = _interopRequireDefault(_);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

var pkg = _readPkgUp2.default.sync().pkg;

var help = [
'Usage: php2html <input> [<option>]', 
'', 
'Options:', 
'   -b, --baseDir        Your base directory', 
'   -r, --router         Specify router script', 
'   -p, --processLinks   Convert links pointing to .php pages to the .html equivalent.', 
'   -g, --getData        Pass data to php file using $_GET.'].
join('\n');

var cli = (0, _meow2.default)({ 
    help: help, 
    pkg: pkg }, 
{ 
    alias: { 
        b: 'baseDir', 
        r: 'router', 
        p: 'processLinks', 
        g: 'getData', 
        v: 'version' } });



// cleanup cli flags and assert cammelcase keeps camelcase
cli.flags = (0, _reduce2.default)(cli.flags, function (res, val, key) {
    if (key.length <= 1) {
        return res;}


    switch (key) {
        case 'processlinks':
            res.processLinks = val;
            break;
        case 'basedir':
            res.baseDir = val;
            break;
        case 'getdata':
            res.getData = val;
            break;
        default:
            res[key] = val;}


    return res;}, 
{});

if (cli.flags.getData) {
    try {
        cli.flags.getData = JSON.parse(cli.flags.getData);} 
    catch (err) {
        error(err);}}



if (cli.flags['update-notifier'] !== false) {
    (0, _updateNotifier2.default)({ pkg: pkg }).notify();}


function error(err) {
    process.stderr.write((0, _indentString2.default)(_chalk2.default.red(err.message || err), '   ' + _chalk2.default.red('Error: ')));
    process.stderr.write(_os2.default.EOL);
    process.stderr.write((0, _indentString2.default)(help, '   '));
    process.exit(1);}


function prepare(data) {
    if (process.stdin.isTTY) {
        cli.showHelp();}


    // check for references to original file
    var check = data.match(/(__DIR__)|(__FILE__)/);
    if (check) {
        var msg = '"' + (0, _compact2.default)((0, _tail2.default)(check)).join('" and "') + '" detected. This can\'t be resolved for piped content.';
        return error(new Error(msg));}


    _tmp2.default.file({ 
        dir: cli.flags.baseDir || process.cwd(), 
        prefix: '.cli-temp-', 
        postfix: '.php' }, 
    function (err, filepath, fd, cleanupCallback) {
        process.on('exit', cleanupCallback);
        process.on('cleanup', cleanupCallback);
        process.on('uncaughtException', cleanupCallback);

        if (err) {
            error(err);} else 
        {
            _fs2.default.writeFile(filepath, data, function (err) {return err && error(err) || run(filepath);});}});}




function run(data) {
    (0, _2.default)(data, cli.flags).
    then(function (val) {return process.stdout.write(val);}).
    catch(function (err) {return error(err);});}


if (cli.input[0]) {
    run(_path2.default.resolve(cli.input[0]));} else 
{
    (0, _getStdin2.default)().then(prepare);}