/*eslint-env node*/
const gulp = require('gulp');
const del = require('del');
const log = require('fancy-log');
const gulpif = require('gulp-if');

//css-related
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

//images
const responsive = require('gulp-responsive');

//live editing
const browserSync = require('browser-sync').create();

//js-related
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify-es').default;

const rollup = require('gulp-rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const sourcemaps = require('gulp-sourcemaps');

//html related
const htmlmin = require('gulp-htmlmin');

//general purpose
const gzip = require('gulp-gzip');

gulp.task('img:copy', function () {
  return gulp.src(['img/**/*'])
    .pipe(gulp.dest('build/img'));
});

/* generate a set of responsive images from the set of big images*/
gulp.task('img:process', gulp.series('img:copy', function () {
  const config = {
    '*.webp': [
      {
        width: 800,
        quality: 75,
        rename: { suffix: '_800' }
      }, {
        width: 550,
        rename: { suffix: '_550' }
      }, {
        width: 250,
        rename: { suffix: '_250' }
      }, {
        width: 150,
        rename: { suffix: '_150' }
      }]
  };

  return gulp.src('img_src/*.webp')
    .pipe(responsive(config, {
      // global quality for all images
      quality: 95,
      errorOnUnusedImage: false
    }))
    .pipe(gulp.dest('build/photos'));
}));

gulp.task('img:clean', function () {
  return del([
    'build/photos/**/*'
  ]);
});


//get options from the command line
var args = require('minimist')(process.argv.slice(2));
log(args);

var compact = args.compress || false;  
compact = (compact === 'true') ? true : false;


gulp.task('js:sw:copy', function () {
  return gulp.src(['sw.js'])
    .pipe(gulpif(compact, uglify(), gzip({ threshold: 1024 })))
    .pipe(gulp.dest('build'));
});


gulp.task('js:copy', function () {
  return gulp.src(['./js/restaurant_info.js','./js/common.js','./js/dbhelper.js','./js/main.js', './node_modules/idb/**/*.js']/*.concat(deps)*/)
    .pipe(sourcemaps.init())
    .pipe(rollup({
      // entry points
      input: ['./js/main.js', './js/restaurant_info.js'],
      output: {
        format: 'es'
      },
      plugins: [
        resolve(),
        //there is bug with the current version ("rollup-plugin-commonjs": "^9.1.3"), using 8.4.1 instead
        commonjs({
          // if false then skip sourceMap generation for CommonJS modules
          sourceMap: false
        })
      ]    
    }))
    .pipe(gulpif(compact, uglify()))
    .pipe(sourcemaps.write())
    .pipe(gulpif(compact,
      gzip({ threshold: 1024 }))
    )
    .pipe(gulp.dest('build/js'));
});

gulp.task('html:copy', function () {
  return gulp.src('./*.html')
    .pipe(gulpif(compact,
      htmlmin({
        collapseWhitespace: true, removeComments : true,
        minifyCSS: true, minifyJS: true})))
    .pipe(gulpif(compact,
      gzip({ threshold: 1024 }))
    )
    .pipe(gulp.dest('./build/'));
});

gulp.task('css:process', function () {
  return gulp.src(['sass/**/*.scss'])
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulpif(compact,
      gzip({ threshold: 1024 }))
    )
    .pipe(gulp.dest('build/css'));
});


gulp.task('process', gulp.series(['css:process', 'img:process']));
gulp.task('copy', gulp.series(['js:sw:copy', 'js:copy', 'html:copy']));
gulp.task('clean', function () {
  return del([
    'build/**/*'
  ]);
});

gulp.task('attach', function () {
  return browserSync.init({
    // URL of the website we want to proxy
    proxy: 'http://127.0.0.1:8080'
  });
});

gulp.task('watch', function () {
  gulp.watch('sass/**/*.scss', gulp.series(['css:process']));
  gulp.watch('js/**/*.js', gulp.series(['js:copy']))
    .on('change', function (path) {
      log('File ' + path + ' was changed');
    });
  gulp.watch('*.html', gulp.series(['html:copy']));
  gulp.watch('sw.js', gulp.series(['js:sw:copy']));
  gulp.watch('build/**', browserSync.reload);
});

gulp.task('lint', () => {
  return gulp.src(['**/*.js', '!node_modules/**', '!build/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});

gulp.task('default', gulp.series(['lint', 'clean', 'copy', 'process', 'watch']));
