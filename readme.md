# php2html [![Build Status](https://github.com/bezoerb/php2html/workflows/Tests/badge.svg)](https://github.com/bezoerb/php2html/actions?workflow=Tests)  [![Coverage Status](https://coveralls.io/repos/github/bezoerb/php2html/badge.svg?branch=master)](https://coveralls.io/github/bezoerb/php2html?branch=master)


> Convert php files to html


## Install

```
$ npm install --save php2html
```


To make this work you need the `php-cgi` binaray in your PATH.

### Installing php-cgi

##### OSX

The `php-cgi` binary can be installed via Homebrew by tapping the
[homebrew-php](https://github.com/josegonzalez/homebrew-php) repository:

```shell
brew install php@7.3
```

##### Windows

The `php-cgi` binary can be installed via [XAMPP](http://www.apachefriends.org/de/xampp-windows.html). 
Here is how you can add the binary to your PATH: [Link](https://www.monosnap.com/image/psLZ5fpwuSsvJJeZPdklEjxMr)

##### Ubuntu

```shell
sudo apt-get install php-cgi
```

## Build plugins

- [grunt-php2html](https://github.com/bezoerb/grunt-php2html)
- [gulp-php2html](https://github.com/bezoerb/gulp-php2html)

## Usage

```js
var php2html = require('php2html');

php2html('index.php', function(err,data){
	// do something awesome
});
```

## CLI

```shell
~$ php2html index.php > index.html
```
```shell
~$ cat index.php | php2html > index.html
```


#### with router (for use with frameworks like symfony or yii)

```shell
php2html / --baseDir web --router web/app_dev.php > index.html
```



## API

### php2html(input, [options], callback)

#### input

*Required*  
Type: `string`


#### options

##### baseDir
Type: `String`
Default value: process.cwd()

Specify a docroot for the php Server. All php files will be served relative to this directory.

##### router
Type: `String`
Default value: `undefined`

Use a router script. Useful for frameworks like `symfony`

##### processLinks
Type: `Boolean`
Default value: `false`

Convert internal links pointing to `.php` pages to the `.html` equivalent.

##### getData
Type: `Object`
Default value: `{}`

Pass data to php file using $_GET.

##### port
Type: `Int`
Default value: `undefined`

`php2html` will use a random for port to fetch content. Use this option to manually specify the port. 
  
##### requestHost
Type: `String`
Default value: `undefined`

USe this option to tweak the request host passed to the `.php` script as `SERVER_NAME` and `SERVER_PORT`.   

## License

MIT © [Ben Zörb](http://sommerlaune.com)
