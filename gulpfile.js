var gulp = require('gulp');

var fs = require('fs');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var concatCss = require('gulp-concat-css');

var BUILD_DIR = './';

var paths = {
    scripts: ['js/util.js', 'js/flexvideo.js', 'js/bgv.js', 'js/toppage.js'],
    less: ['less/**/*.less'],
    css: ['css/bootstrap-html5lab.css', 'css/html5lab.css']
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
        .pipe(gulp.dest(BUILD_DIR + '/css'));
});

gulp.task('css', function() {
    return gulp.src(paths.css)
        .pipe(minifyCss({keepBreaks: false}))
        .pipe(concatCss('all.min.css'))
        .pipe(gulp.dest(BUILD_DIR + '/css'));
});

gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
    gulp.watch(paths.less, ['less']);
    gulp.watch(paths.images, ['css']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['scripts', 'less', 'css', 'watch']);
