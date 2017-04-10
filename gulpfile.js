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
      dist: basePath + 'components/**/index.js',
      demo: basePath + 'components/**/demo-*.js'
    }
  },
  build: './build/',
  demo: './build/demo/',
  dist: './build/components/',
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
  console.log('========== Сборка HTML для DEMO')

  function modifyForGHPages (filename) {
    return 'uicomp/demo/' + filename
  }

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
      manifest: gulp.src(paths.manifest + 'css.json', { allowEmpty: true }),
      modifyReved: modifyForGHPages
    }),
    $.revReplace({
      manifest: gulp.src(paths.manifest + 'scripts.json', { allowEmpty: true }),
      // modifyReved: modifyForGHPages
    }),
    $.htmlmin({ collapseWhitespace: true })
  )))
  .pipe(gulp.dest(paths.demo))
  .pipe($.if(isDevelopment, browserSync.stream()))
})

gulp.task('templates:dist', function () {
  console.log('========== Подготовка исходного HTML')

  return gulp.src(paths.src.templates[0], { since: gulp.lastRun('templates:dist') })
  .pipe($.replace(/\n\s*<!--DEMO[\s\S]+?DEMO-->/gm, ''))
  .pipe($.rename(function (path) {
    path.extname = ".html"
  }))
  .pipe(gulp.dest(paths.dist))
})

gulp.task('styles:demo', function () {
  console.log('========== Сборка CSS для DEMO')

  return combiner(
    gulp.src(paths.src.styles, { since: gulp.lastRun('styles:demo') }),
    $.replace('//DEMO ', ''),
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

gulp.task('styles:dist', function () {
  console.log('========== Подготовка исходного CSS')

  return combiner(
    gulp.src([paths.src.styles[0], basePath + '_include/styles/general.less'], { since: gulp.lastRun('styles:dist') }),
    $.replace(/\n\s*\/\*DEMO[\s\S]+?DEMO\*\/ /gm, ''),
    $.less(),
    $.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 11'],
      cascade: true
    }),
    gulp.dest(paths.dist)
  ).on('error', $.notify.onError())
})

gulp.task('scripts:demo', function (callback) {
  console.log('========== Сборка JS для DEMO')

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
      publicPath: '',
      filename: isDevelopment ? '[name].js' : '[name]-[chunkhash:10].js'
    }
  }

  if (!isDevelopment) {
    options.plugins.push(new AssetsPlugin({
      filename: 'scripts.json',
      path: paths.manifest,
      processOutput(assets) {
        for (let key in assets) {
          let compDir = key.replace('demo-', '') + '/'

          assets[compDir + key + '.js'] = 'uicomp/demo/' + compDir + assets[key].js.slice(options.output.publicPath.length)
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
    let dirName = getFileName(file).title.split('-')[1] + '/'

    return paths.demo + dirName
  }))
  .on('data', function () {
    if (firstBuildReady) {
      callback()
    }
  })
})

gulp.task('scripts:dist', function () {
  console.log('========== Подготовка исходного JS')

  return gulp.src(paths.src.scripts.dist)
  .pipe(gulp.dest(paths.dist))
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

gulp.task('clean:dist', function () {
  console.log('========== Очистка папок DIST')

  return del(paths.dist)
})

gulp.task('clean:all', function () {
  console.log('========== Очистка папок сборки')

  del(paths.manifest)
  return del(paths.build)
})

gulp.task('build:demo', gulp.series(
  'clean:all',
  gulp.series(
    'lint:js',
    'scripts:demo',
    'styles:demo',
    'templates:demo'
  )
))

gulp.task('build:dist', gulp.series(
  'build:demo',
  gulp.parallel(
    'templates:dist',
    'styles:dist',
    'scripts:dist'
  )
))

gulp.task('deploy', function() {
  gulp.series('build:dist')
  console.log('========== Публикация содержимого ./build/ на GH-pages')
  return gulp.src(paths.build + '**/*')
  .pipe($.ghPages())
});

gulp.task('watch', function () {
  gulp.watch(paths.src.templates, gulp.series('templates:demo'))
  gulp.watch(paths.src.styles, gulp.series('styles:demo'))
  $.if(isDevelopment, gulp.watch(paths.src.scripts.all, gulp.series('lint:js')))
})

gulp.task('serve', function () {
  browserSync.init({
    server: paths.demo
  })
})

gulp.task('default', gulp.series('build:demo', gulp.parallel('watch', 'serve')))
