var gulp = require('gulp');
var browserSync = require('browser-sync').create();

gulp.task('default', function() {
  browserSync.init({
    server: {
        baseDir: "./src/",
        index: "index.html"
    }
  });
  gulp.watch('src/**/*.html', gulp.task('reload'));
  gulp.watch('src/css/*.css', gulp.task('reload'));
  gulp.watch('src/js/*.js', gulp.task('reload'));
  gulp.watch('src/js/main/*.js', gulp.task('reload'));
});

gulp.task('reload', function () {
  browserSync.reload();
  done();
});