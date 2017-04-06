'use strict'
const baseBath = './src/'
const paths = {
  src: {
    styles: [
      baseBath + 'components/**/*.less',
      baseBath + 'navigation.less'
    ]
  },
  build: './build/'
}
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'

const gulp = require('gulp')
const sourcemaps = require('gulp-sourcemaps')
const gulpIf = require('gulp-if')
const less = require('gulp-less')
const del = require('del')

gulp.task('html', function () {
  return gulp.src(baseBath + '**/*.html', { since: gulp.lastRun('html') })
  .pipe(gulp.dest(paths.build))
})

gulp.task('styles', function () {
  return gulp.src(paths.src.styles, { base: baseBath })
  .pipe(gulpIf(isDevelopment, sourcemaps.init()))
  .pipe(less({
    paths: [baseBath + '_include/styles']
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

gulp.task('watch', function () {
  gulp.watch(baseBath + '**/*.html', gulp.series('html'))
  gulp.watch(paths.src.styles, gulp.series('styles'))
})

gulp.task('default', gulp.series('build', 'watch'))
