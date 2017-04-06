'use strict'

const paths = {
  src: './src/',
  build: './build/'
}
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'

const gulp = require('gulp')
const sourcemaps = require('gulp-sourcemaps')
const gulpIf = require('gulp-if')
const less = require('gulp-less')
const del = require('del')

gulp.task('html', function () {
  return gulp.src(paths.src + '**/*.html')
  .pipe(gulp.dest(paths.build))
})

gulp.task('styles', function () {
  return gulp.src([
    paths.src + '/components/**/*.less',
    paths.src + 'navigation.less'
  ], { base: paths.src })
  .pipe(gulpIf(isDevelopment, sourcemaps.init()))
  .pipe(less({
    paths: [paths.src + '_include/styles']
  }))
  .pipe(gulpIf(isDevelopment, sourcemaps.write()))
  .pipe(gulp.dest(paths.build))
})

gulp.task('clean', function () {
  return del(paths.build)
})

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('html', 'styles')
))

gulp.task('default', function () {

})
