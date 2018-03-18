const gulp = require('gulp');
const del = require('del');
const responsive = require('gulp-responsive');
const rename = require('gulp-rename');

/* generate a set of responsive images from the big source image*/
gulp.task('img:process', function () {
    const config = {
      '*.jpg': [
      {
          width: 1100,
          rename: {suffix : '_1100'}
      },{
          width: 550,
          rename: {suffix : '_550'}
      },{
        width: 250,
        rename: {suffix : '_250'}
      },{
        width: 150,
        rename: {suffix : '_150'}
      }]};

    return gulp.src('img_src/*.jpg')
      .pipe(responsive(config, {
        // global quality for all images
        quality: 95,
        errorOnUnusedImage: false
      }))
      .pipe(gulp.dest('img'));
  });


  gulp.task('img:clean', function () {
      return del([
        'img/**/*'
      ]);    
  });

  gulp.task('default', gulp.series(['img:clean', 'img:process']));
