var gulp = require('gulp');

var fs = require('fs');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var cssMin = require('gulp-cssmin');

var BUILD_DIR = './';

var paths = {
    scripts: ['js/util.js', 'js/flexvideo.js', 'js/bgv.js', 'js/toppage.js'],
    less: ['less/**/*.less']
};

gulp.task('scripts', function() {
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(paths.scripts)
        .pipe(uglify())
        .pipe(concat('toppage.all.min.js'))
        .pipe(gulp.dest(BUILD_DIR + '/js'));
});

gulp.task('less', function() {
    return gulp.src(paths.less)
        .pipe(less())
        .pipe(cssMin())
        .pipe(gulp.dest(BUILD_DIR + '/css'));
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
    gulp.watch(paths.less, ['less']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['scripts', 'less', 'watch']);
