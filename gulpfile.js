'use strict'

const basePath = './src/'
const paths = {
  src: {
    styles: [
      basePath + 'components/**/*.less',
      basePath + 'navigation.less'
    ],
    scripts: {
      all: basePath + 'components/**/*.js',
      dist: basePath + 'components/**/page-*.js'
    }
  },
  build: './build/',
  manifest: './manifest/'
}
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'

const path = require('path')
const gulp = require('gulp')
const $ = require('gulp-load-plugins')()
// const debug = require('gulp-debug')
const del = require('del')
const browserSync = require('browser-sync').create()
const combiner = require('stream-combiner2').obj
const webpackStream = require('webpack-stream')
const webpack = webpackStream.webpack
const AssetsPlugin = require('assets-webpack-plugin')
const named = require('vinyl-named')

gulp.task('html', function () {
  console.log('========== Сборка HTML')
  return gulp.src(basePath + '**/*.html', { since: gulp.lastRun('html') })
  .pipe($.if(!isDevelopment, combiner(
    $.revReplace({
      manifest: gulp.src(paths.manifest + 'css.json', { allowEmpty: true })
    }),
    $.revReplace({
      manifest: gulp.src(paths.manifest + 'scripts.json', { allowEmpty: true })
    })
  )))
  .pipe(gulp.dest(paths.build))
  .pipe($.if(!isDevelopment, browserSync.stream()))
})


gulp.task('templates:demo', function () {
  console.log('========== Сборка HTML')
  // let replaceRegExp = isDevelopment ? /\n\s*<!--DEV|DEV-->/gm : /\n\s*<!--DEMO[\s\S]+?DEMO-->/gm

  return gulp.src(paths.src.templates, { since: gulp.lastRun('templates:demo') })
  .pipe($.replace(/\n\s*<!--DEMO|DEMO-->/gm, ''))
  .pipe($.data(getFileName))
  .pipe($.nunjucksRender({
    data: {
      Layout: path.join(__dirname, basePath + '_include/demo-layout.njk'),
      components: componentsList
    }
  }))
  .pipe($.if(!isDevelopment, combiner(
    $.revReplace({
      manifest: gulp.src(paths.manifest + 'css.json', { allowEmpty: true })
    }),
    $.revReplace({
      manifest: gulp.src(paths.manifest + 'scripts.json', { allowEmpty: true })
    })
  )))
  .pipe(gulp.dest(paths.demo))
  .pipe($.if(isDevelopment, browserSync.stream()))
})

gulp.task('styles', function () {
  return combiner(
    gulp.src(paths.src.styles, { base: basePath, since: gulp.lastRun('styles') }),
    $.if(isDevelopment, $.sourcemaps.init()),
    $.if(isDevelopment, $.stylelint({
      reporters: [{ formatter: 'string', console: true }]
    })),
    $.less({
      paths: [basePath + '_include/styles']
    }),
    $.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 11'],
      cascade: false
    }),
    $.if(isDevelopment, $.sourcemaps.write()),
    $.if(!isDevelopment, combiner(
      $.csso({
        restructure: !isDevelopment
      }),
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

gulp.task('scripts', function (callback) {
  let firstBuildReady = false
  let options = {
    watch: isDevelopment,
    devtool: isDevelopment ? 'cheap-module-inline-source-map' : null,
    module: {
      loaders: [
        {
          test: /\.js$/,
          include: path.join(__dirname, basePath + 'components/'),
          loader: 'babel-loader'
        }
      ]
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ],
    output: {
      publicPath: basePath,
      filename: isDevelopment ? '[name].js' : '[name]-[chunkhash:10].js'
    }
  }

  if (!isDevelopment) {
    options.plugins.push(new AssetsPlugin({
      filename: 'scripts.json',
      path: paths.manifest,
      processOutput(assets) {
        for (let key in assets) {
          assets[key + '.js'] = assets[key].js.slice(options.output.publicPath.length)
          delete assets[key]
        }
        return JSON.stringify(assets)
      }
    }))
  }

  function done (err, stats) {
    firstBuildReady = true
    if (err) return
    console.log(stats.toString({ colors: true }))
  }

  return gulp.src(paths.src.scripts.dist)
  .pipe($.plumber({
    errorHandler: $.notify.onError()
  }))
  .pipe(named())
  .pipe(webpackStream(options, null, done))
  .pipe($.if(!isDevelopment, $.uglify()))
  .pipe(gulp.dest(paths.build))
  .on('data', function () {
    if (firstBuildReady) {
      callback()
    }
  })
})

gulp.task('assets', function () {
  return gulp.src('./tpmPath', { since: gulp.lastRun('assets') })
})

gulp.task('lint', function () {
  return combiner(
    gulp.src(paths.src.scripts.all, { since: gulp.lastRun('lint') }),
    $.eslint(),
    $.eslint.format(),
    $.eslint.failAfterError(),
    gulp.dest(paths.build)
  ).on('error', $.notify.onError())
})

gulp.task('clean', function () {
  console.log('========== Очистка папок сборки')
  del(paths.manifest)
  return del(paths.build)
})

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('html', 'styles', gulp.series('lint', 'scripts'))
))

gulp.task('watch', function () {
  gulp.watch(basePath + '**/*.html', gulp.series('html'))
  gulp.watch(paths.src.styles, gulp.series('styles'))
  $.if(isDevelopment, gulp.watch(paths.src.scripts.all, gulp.series('lint')))
})

gulp.task('serve', function () {
  browserSync.init({
    server: paths.build
  })
})

gulp.task('default', gulp.series('build', gulp.parallel('watch', 'serve')))
