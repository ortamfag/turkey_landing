const gulp         = require('gulp');
const browserSync  = require('browser-sync');
const sass         = require('gulp-sass')(require('sass'));
const rename       = require("gulp-rename");
const cleanCSS     = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const jade         = require('gulp-jade');
const imagemin     = require('gulp-imagemin');
const pngquant     = require('imagemin-pngquant');
const cache        = require('gulp-cache');
const babel        = require('gulp-babel');
const uglify       = require('gulp-uglifyjs');


// Static server
gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('styles', function() {
    return gulp.src('assets/sass/*.+(scss|sass)')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename({
            prefix: "",
            suffix: ".min",
          }))
        .pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('assets/css'))
        .pipe(browserSync.stream());
});

// gulp.task('jade', function() {
//     return gulp.src('assets/jade/index.jade')
//         .pipe(jade({
//             pretty: true
//         }))
//         .pipe(gulp.dest('./'))
//         .pipe(browserSync.stream());
// });

// gulp.task('jade-any', function() {
//     return gulp.src('assets/jade/pages/*.jade')
//         .pipe(jade({
//             pretty: true
//         }))
//         .pipe(gulp.dest('./pages'))
//         .pipe(browserSync.stream());
// });

// gulp.task('scriptsMain', function() {
//     return gulp.src('assets/js/*.js')// Берем все необходимые библиотеки
//         // Берем JS
//         .pipe(rename({
//             prefix: "",
//             suffix: ".min",
//         }))
//         .pipe(babel({
//             presets: ['@babel/preset-env']
//         }))
//         .pipe(uglify()) // Сжимаем JS файл
//         .pipe(gulp.dest('assets/js')) // Выгружаем
//         .pipe(browserSync.stream());
// });

// gulp.task('img', function() {

//     return gulp.src('assets/img/*.+(jpg|png|gif)') // Берем все изображения
//         .pipe(imagemin({ // Сжимаем изображения без кеширования
//             interlaced: true,
//             progressive: true,
//             svgoPlugins: [{removeViewBox: false}],
//             use: [pngquant()]
//         }))
//         .pipe(gulp.dest('assets/img')); // Выгружаем на продакшен
// });

gulp.task('watch', function() {
    gulp.watch('assets/sass/*.+(scss|sass)', gulp.parallel('styles'))
    gulp.watch('assets/sass/components/*.+(scss|sass)', gulp.parallel('styles')).on('change', browserSync.reload)
    // gulp.watch('assets/jade/*.jade', gulp.parallel('jade'))
    // gulp.watch('assets/jade/pages/*.jade', gulp.parallel('jade-any'))
    // gulp.watch('assets/js/*.js', gulp.parallel('scriptsMain'))
    // gulp.watch('assets/img/*.+(jpg|png|gif)', gulp.parallel('img'));
    gulp.watch('assets/img/*.+(png|jpg|jpeg|webp|svg').on('change', browserSync.reload);
    gulp.watch('./*.html').on('change', browserSync.reload);
});

gulp.task('default', gulp.parallel('watch', 'server', 'styles' ))