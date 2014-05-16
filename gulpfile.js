var gulp = require('gulp');

var fs = require('fs');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');

var BUILD_DIR = '_site'

var paths = {
    scripts: ['js/**/*.js'],
    less: ['less/**/*.less'],
    images: 'img/**/*'
};

gulp.task('scripts', function() {
    // Minify and copy all JavaScript (except vendor scripts)
    return gulp.src(paths.scripts)
        .pipe(uglify())
        .pipe(concat('all.min.js'))
        .pipe(gulp.dest(BUILD_DIR + '/js'));
});

gulp.task('less', function() {
    gulp.src(paths.less)
        .pipe(less())
        .pipe(gulp.dest(BUILD_DIR + '/css'));
});

// Copy all static images
gulp.task('images', function() {
    return gulp.src(paths.images)
    // Pass in options to the task
        .pipe(imagemin({optimizationLevel: 5}))
        .pipe(gulp.dest(BUILD_DIR + '/img'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
    gulp.watch(paths.less, ['less']);
    gulp.watch(paths.images, ['images']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['scripts', 'less', 'images', 'watch']);
