const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const browserify = require('gulp-browserify')

// gulp.task('html', function (){
//   return gulp.src('src/components/**/*.html')
//   .pipe(gulp.dest('build/html'))
// })

gulp.task('style', function () {
  return gulp.src('./src/**/*.css')
    .pipe(browserSync.stream());
})

gulp.task('js', function () {
  gulp.src('./src/**/*.js')
    .pipe(browserify({
      insertGlobals : true
    }))
    // .pipe(browserSync.reload())
    .pipe(gulp.dest('./src'))
})

gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: "./src/"
    }
  })

  gulp.watch("./src/**/*.css", ['style'])
  gulp.watch("./src/**/*.js", ['js'])
  gulp.watch('./src/**/*.html').on('change', browserSync.reload)
})

gulp.task('default', ['serve'])
