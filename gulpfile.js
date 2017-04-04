const gulp = require('gulp')
const browserSync = require('browser-sync').create()

// gulp.task('html', function (){
//   return gulp.src('src/components/**/*.html')
//   .pipe(gulp.dest('build/html'))
// })

gulp.task('style', function () {
  return gulp.src('./src/**/*.css')
  .pipe(browserSync.stream());
})

gulp.task('serve', function () {
  browserSync.init({
    server: {
      baseDir: "./src/"
    }
  })

  gulp.watch("./src/**/*.css", ['style'])
  gulp.watch('./src/**/*.html').on('change', browserSync.reload)
})

gulp.task('default', [ 'serve' ])
