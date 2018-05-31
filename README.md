#  Mobile Web Specialist Certification Course - Evaluation project -  "Mobile Web Specialist Restaurant Reviews App: Stage 2"

**Restaurant Reviews** Stage 1 project.

**Restaurant Reviews** are evaluation projects under [Udacity's Mobile Web Specialist Nanodegree](https://www.udacity.com/course/mobile-web-specialist-nanodegree--nd024). One needs incrementally convert a static webpage to a mobile-ready web application.


## Project Overview

In **Stage Two**, one will take the responsive, accessible design she built in Stage One and connect it to an external server. One will begin by using asynchronous JavaScript to request JSON data from the server. One will store data received from the server in an offline database using IndexedDB, which will create an app shell architecture. Finally, one will work to optimize your site to meet performance benchmarks (testing using Lighthouse).

### Task specification

1. Use server data instead of local memory In the first version of the application, all of the data for the restaurants was stored in the local application. You will need to change this behavior so that you are pulling all of your data from the server instead, and using the response data to generate the restaurant information on the main page and the detail page.

2. Use IndexedDB to cache JSON responses In order to maintain offline use with the development server you will need to update the service worker to store the JSON received by your requests using the IndexedDB API. As with Stage One, any page that has been visited by the user should be available offline, with data pulled from the shell database.

3. Meet the minimum performance requirements Once you have your app working with the server and working in offline mode, you’ll need to measure your site performance using Lighthouse.

Lighthouse measures performance in four areas, but your review will focus on three:

    * Progressive Web App score should be at 90 or better.
    * Performance score should be at 70 or better.
    * Accessibility score should be at 90 or better.
 

## Getting started

This section contains some instructions to build and run the project.

### Prerequisites

To install:
1. [Node.js](https://nodejs.org/en/) - JavaScript runtime
2. [node-gyp](https://www.npmjs.com/package/node-gyp) - command-line tool to compile native addon modules for Node.js
3. [gulp](https://gulpjs.com/) - build automation tool
4. [http-server](https://www.npmjs.com/package/http-server) - simple https server

#### Installation notes

gulp-responsive has a dependency on sharp, which in turn requires to compile native Node module.
To compile Node modules [node-gyp](https://www.npmjs.com/package/node-gyp) is used.

To be able to use it on on Windows, install `windows-build-tools`.
From administrative PowerShell run the following commands: 
`npm install --global --production windows-build-tools`
`npm config set msvs_version 2015 --global`

For more information please refer to https://github.com/chjj/pty.js/issues/60.

### Install

After cloning the project run `npm install` from the root folder.

### Build

From the root folder run `gulp`. This runs projet's task in a sequence:

1. 'img:clean' - cleaning previously generated images
2. 'img:process' - generating a set of responsive images (different resolution and compression level) based on a source image.

### Run

Serving application on localhost:8080, run from the root folder :
`npm start`

This command starts an https-server with 24h cache time (cache-control max-age header) and gzip option (serving *.gzip if available).

### Tools

Here is a list of dev tools (gulp plugins):

1. [Html minifier](https://github.com/kangax/html-minifier)
2. [Gzip compressor](https://github.com/jstuckey/gulp-gzip)
3. [Rollup](https://github.com/rollup/rollup) - ES6 module bundeler
4. [Browsersync](https://browsersync.io/)


