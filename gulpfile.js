'use strict'

const baseBath = './src/'
const paths = {
  src: {
    styles: [
      baseBath + 'components/**/*.less',
      baseBath + 'navigation.less'
    ],
    scripts: [baseBath + 'components/**/*.js']
  },
  build: './build/',
  manifest: './manifest/'
}
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'

const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
// const debug = require('gulp-debug')
const del = require('del')
const browserSync = require('browser-sync').create()
const combiner = require('stream-combiner2').obj

gulp.task('html', function () {
  return gulp.src(baseBath + '**/*.html', { since: gulp.lastRun('html') })
  .pipe($.if(!isDevelopment, $.revReplace({
    manifest: gulp.src(paths.manifest + 'css.json', { allowEmpty: true })
  })))
  .pipe(gulp.dest(paths.build))
  .pipe(browserSync.stream())
})

gulp.task('styles', function () {
  return combiner(
    gulp.src(paths.src.styles, { base: baseBath, since: gulp.lastRun('styles') }),
    $.if(isDevelopment, $.sourcemaps.init()),
    $.less({
      paths: [baseBath + '_include/styles']
    }),
    $.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 11'],
      cascade: false
    }),
    $.if(isDevelopment, $.sourcemaps.write()),
    $.if(!isDevelopment, combiner(
      $.csso(),
      $.rev())
    ),
    gulp.dest(paths.build),
    $.if(!isDevelopment, combiner(
      $.rev.manifest('css.json'),
      gulp.dest(paths.manifest))
    ),
    browserSync.stream()
  ).on('error', $.notify.onError())
})

// gulp.task('scripts', ['lint'], function () {
//
// })

gulp.task('assets', function () {
  return gulp.src('./tpmPath', { since: gulp.lastRun('assets') })
})

gulp.task('lint', function () {
  return combiner(
    gulp.src(paths.src.scripts, { since: gulp.lastRun('lint') }),
    $.eslint(),
    $.eslint.format(),
    gulp.dest(paths.build)
  ).on('error', $.notify.onError())
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
  gulp.watch(paths.src.scripts, gulp.series('lint'))
})

gulp.task('serve', function () {
  browserSync.init({
    server: paths.build
  })
})

gulp.task('default', gulp.series('build', gulp.parallel('watch', 'serve')))
