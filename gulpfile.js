'use strict'

const basePath = './src/'
const paths = {
  src: {
    templates: [
      basePath + 'components/**/*.{html,njk}',
      basePath + 'index.njk'
    ],
    styles: [
      basePath + 'components/**/*.{css,less}',
      basePath + 'navigation.less'
    ],
    scripts: {
      all: basePath + 'components/**/*.js',
      demo: basePath + 'components/**/demo-*.js'
    }
  },
  demo: './build/demo/',
  build: './build/',
  manifest: './manifest/'
}
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'

const componentsList = require('./src/components-list.json')
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

function getFileName (file) {
  return {
    title: file.stem
  }
}

gulp.task('templates:demo', function () {
  console.log('========== Сборка HTML')
  return gulp.src(paths.src.templates, { since: gulp.lastRun('templates:demo') })
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

gulp.task('styles:demo', function () {
  return combiner(
    gulp.src(paths.src.styles, { since: gulp.lastRun('styles:demo') }),
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
      $.csso(),
      $.rev())
    ),
    gulp.dest(paths.demo),
    $.if(!isDevelopment, combiner(
      $.rev.manifest('css.json'),
      gulp.dest(paths.manifest))
    ),
    $.if(isDevelopment, browserSync.stream())
  ).on('error', $.notify.onError())
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
    $.if(isDevelopment, browserSync.stream())
  ).on('error', $.notify.onError())
})

gulp.task('scripts:demo', function (callback) {
  let firstBuildReady = false
  let options = {
    watch: isDevelopment,
    devtool: isDevelopment ? 'cheap-module-inline-source-map' : null,
    module: {
      loaders: [
        {
          test: /\.js$/,
          loader: 'babel-loader'
        }
      ]
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ],
    output: {
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

  return gulp.src(paths.src.scripts.demo)
  .pipe($.plumber({
    errorHandler: $.notify.onError()
  }))
  .pipe(named())
  .pipe(webpackStream(options, null, done))
  .pipe($.if(!isDevelopment, $.uglify()))
  .pipe(gulp.dest(function (file) {
    let dirName = getFileName(file).title.replace('demo-', '') + '/'
    return paths.demo + dirName
  }))
  .on('data', function () {
    if (firstBuildReady) {
      callback()
    }
  })
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

  return gulp.src(paths.src.scripts.demo)
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

gulp.task('lint:js', function () {
  return combiner(
    gulp.src(paths.src.scripts.all, { since: gulp.lastRun('lint:js') }),
    $.eslint(),
    $.eslint.format(),
    $.eslint.failAfterError()
  ).on('error', $.notify.onError())
})

gulp.task('clean', function () {
  console.log('========== Очистка папок сборки')
  del(paths.manifest)
  return del(paths.build)
})

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel('templates:demo', 'styles:demo', gulp.series('lint:js', 'scripts:demo'))
))

gulp.task('watch', function () {
  gulp.watch(paths.src.templates, gulp.series('templates:demo'))
  gulp.watch(paths.src.styles, gulp.series('styles:demo'))
  $.if(isDevelopment, gulp.watch(paths.src.scripts.all, gulp.series('lint:js')))
})

gulp.task('serve', function () {
  browserSync.init({
    server: paths.demo,
    index: "/index.html"
  })
})

gulp.task('default', gulp.series('build', gulp.parallel('watch', 'serve')))
