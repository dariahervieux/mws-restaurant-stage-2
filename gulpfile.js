/*eslint-env node*/
const gulp = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const log = require('fancy-log');

//getting dist dependencies from npm_modules
const npmDist = require('gulp-npm-dist');

//css-relasted
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');

//images
const responsive = require('gulp-responsive');

//live editing
const browserSync = require('browser-sync').create();

//code check
const eslint = require('gulp-eslint');

gulp.task('img:copy', function () {
  return gulp.src(['img/**/*'])
    .pipe(gulp.dest('build/img'));
});

/* generate a set of responsive images from the set of big images*/
gulp.task('img:process', gulp.series('img:copy', function () {
  const config = {
    '*.jpg': [
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

  return gulp.src('img_src/*.jpg')
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

/* Copy dependencies to ./build/js/libs/ */
gulp.task('libs:copy', function () {
  let deps = npmDist();
  // deps.push('!./node_modules/**/gulpfile.js');
  // deps.push('!./node_modules/**/package.json');
  // deps.push('!./node_modules/**/yarn.*');
  // deps.push('!./node_modules/**/LICENSE');
  // deps.push('!./node_modules/**/test/**');
  // deps.push('!./node_modules/**/*.ts');
  log('****List', deps);
  return gulp.src(deps, { base: './node_modules' })
    .pipe(rename(function (path) {
      path.dirname = path.dirname.replace(/\/lib/, '').replace(/\\lib/, '');
    }))
    .pipe(gulp.dest('./build/js/libs'));
});

gulp.task('js:copy', function () {
  return gulp.src(['./**/*.js', '!gulpfile.js', '!./node_modules/**/*'])
    .pipe(gulp.dest('build'));
});

gulp.task('html:copy', function () {
  return gulp.src('./*.html')
    .pipe(gulp.dest('./build/'));
});

gulp.task('css:process', function () {
  return gulp.src(['sass/**/*.scss'])
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest('build/css'));
});


gulp.task('process', gulp.series(['css:process', 'img:process']));
gulp.task('copy', gulp.series(['js:copy', 'html:copy', 'libs:copy']));
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

gulp.task('default', gulp.parallel([gulp.series(['lint', 'clean', 'copy', 'process', 'watch']), 'attach']));
