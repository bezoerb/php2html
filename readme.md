# php2html [![Build Status](https://travis-ci.org/bezoerb/php2html.svg?branch=master)](https://travis-ci.org/bezoerb/php2html)

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
brew tap homebrew/dupes
brew tap homebrew/versions
brew tap homebrew/homebrew-php
brew install php56
```

##### Windows

The `php-cgi` binary can be installed via [XAMPP](http://www.apachefriends.org/de/xampp-windows.html). 
Here is how you can add the binary to your PATH: [Link](https://www.monosnap.com/image/psLZ5fpwuSsvJJeZPdklEjxMr)

##### Ubuntu

```shell
sudo apt-get install php5-cgi
```

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

Use a router script.

##### processLinks
Type: `Boolean`
Default value: `false`

Convert internal links pointing to `.php` pages to the `.html` equivalent.

##### getData
Type: `Object`
Default value: `{}`

Pass data to php file using $_GET.


## License

MIT © [Ben Zörb](http://sommerlaune.com)
