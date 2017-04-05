'use strict'

import config from './config/gulp'
import eslint from 'gulp-eslint'
import stylelint from 'gulp-stylelint'

import gulp from 'gulp'
import plumber from 'gulp-plumber'
import gulpSequence from 'gulp-sequence'
import gulpif from 'gulp-if'
import { create as browserSyncCreate } from 'browser-sync'
import browserify from 'gulp-browserify'
import del from 'del'

const browserSync = browserSyncCreate()
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'dev'

console.log(isDevelopment)

gulp.task('clean', function () {
  console.log('========== Очистка папки сборки')
  return del(config.paths.build)
})

gulp.task('html', function () {
  console.log('========== Сборка HTML')
  return gulp.src(`${config.paths.src}/**/*.html`)
  .pipe(gulp.dest(config.paths.build))
})

gulp.task('style', function () {
  console.log('========== Сборка стилей')
  return gulp.src(`${config.paths.src}/**/*.css`)
  .pipe(gulpif(isDevelopment, plumber()))
  .pipe(stylelint({
    reporters: [
      {formatter: 'string', console: true}
    ]
  }))
  .pipe(gulp.dest(config.paths.build))
  .pipe(gulpif(isDevelopment, browserSync.stream()))
})

gulp.task('js', function () {
  console.log('========== Сборка JS')
  gulp.src(`${config.paths.src}/**/*.js`)
  .pipe(gulpif(isDevelopment, plumber()))
  .pipe(gulpif(isDevelopment, eslint()))
  .pipe(gulpif(isDevelopment, eslint.format()))
  .pipe(browserify({
    insertGlobals: true,
    transform: ['babelify']
  }))
  .pipe(gulp.dest(config.paths.build))
})

gulp.task('build', gulpSequence('clean', ['html', 'style', 'js']))

gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: "./build/"
    }
  })

  gulp.watch("./src/**/*.css", ['style'])
  gulp.watch("./src/**/*.js", ['js']).on('change', browserSync.reload)
  gulp.watch('./src/**/*.html', ['html']).on('change', browserSync.reload)
})

gulp.task('default', gulpSequence('build', 'serve'))
