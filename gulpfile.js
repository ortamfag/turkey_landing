import gulp from 'gulp';
import browserSync from 'browser-sync'
import del from 'del';

// favicons
import imageResize from 'gulp-image-resize';
import ico from 'gulp-to-ico';

// svg sprites
import svgSprite from 'gulp-svg-sprite';

// scss
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import notify from 'gulp-notify';
import rename from 'gulp-rename';
import plumber from 'gulp-plumber';

// js
import webpackStream from 'webpack-stream';

// image
import imagemin from 'gulp-imagemin';
import webp from 'gulp-webp';
import avif from 'gulp-avif';
import newer from 'gulp-newer';
import imageminZopfli from 'imagemin-zopfli';
import imageminWebp from 'imagemin-webp';
import imageminAvif from 'imagemin-avif';

// html
import fileInclude from 'gulp-file-include';
import typograf from 'gulp-typograf';
import htmlmin from 'gulp-htmlmin';

// path
import path from 'path';
import zip from 'gulp-zip';

const sass = gulpSass(dartSass);

// paths
const rootFolder = path.basename(path.resolve());
const srcFolder = './src';
const buildFolder = './dist';

const paths = {
    srcSprites: `${srcFolder}/img/sprites/**.svg`,
    srcScss: `${srcFolder}/scss/**/*.scss`,
    srcMainJs: `${srcFolder}/js/main.js`,
    srcLibraryJs: `${srcFolder}/js/import`,
    srcFullJs: `${srcFolder}/js/**/*.js`,
    srcResourcesFolder: `${srcFolder}/resources`,
    srcImgFolder: `${srcFolder}/img`,
    srcModulesFolder: `${srcFolder}/modules`,

    buildImgFolder: `${buildFolder}/img`,
    buildCssFolder: `${buildFolder}/css`,
    buildLibraryJs: `${buildFolder}/js/import`,
    buildJsFolder: `${buildFolder}/js`,
    buildResourcesFolder: `${buildFolder}/resources`,
};

let isProd = false; // dev by default

// clean "dist" before update
const clean = () => del([buildFolder]);

// svg sprite
const svgSprites = () => gulp.src(paths.srcSprites)
    .pipe(svgSprite({
        mode: {
            stack: {
                sprite: '../sprite.svg',
            },
        },
    }))
    .pipe(gulp.dest(paths.buildImgFolder));

// scss styles
const styles = () => gulp.src(paths.srcScss, {
    sourcemaps: !isProd,
})
    .pipe(plumber(
        notify.onError({
            title: 'SCSS',
            message: 'Error: <%= error.message %>',
        }),
    ))
    .pipe(sass({
        outputStyle: 'compressed',
    }))
    .pipe(autoprefixer({
        cascade: false,
        grid: true,
        overrideBrowserslist: ['last 5 versions, not dead, > 1%, ie 9, ie 10, ie 11, not ie < 8'],
    }))
    .pipe(gulpif(isProd, cleanCSS({
        level: 2,
        compatibility: 'ie8',
    })))
    .pipe(rename({
        prefix: '',
        suffix: '.min',
    }))
    .pipe(gulp.dest(paths.buildCssFolder, {
        sourcemaps: '.',
    }))
    .pipe(browserSync.stream());

// scripts
const scripts = () => gulp.src(paths.srcMainJs)
    .pipe(plumber(
        notify.onError({
            title: 'JS',
            message: 'Error: <%= error.message %>',
        }),
    ))
    .pipe(webpackStream({
        mode: isProd ? 'production' : 'development',
        output: {
            filename: 'main.js',
        },
        module: {
            rules: [{
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {
                                targets: 'defaults',
                            }],
                        ],
                    },
                },
            }],
        },
        devtool: false,
    }))
    .on('error', function (err) {
        console.error('WEBPACK ERROR', err);
        this.emit('end');
    })
    .pipe(gulp.dest(paths.buildJsFolder))
    .pipe(browserSync.stream());

const scriptsLibrary = () => gulp.src(`${paths.srcLibraryJs}/*.js`)
    .pipe(gulp.dest(paths.buildLibraryJs));

// fonts
const fonts = () => gulp.src(`${paths.srcResourcesFolder}/fonts/**`)
    .pipe(gulp.dest(`${paths.buildResourcesFolder}/fonts`));

// favicon
const sizing = [16, 32, 57, 60, 72, 76, 96, 114, 120, 144, 150, 152, 180, 192, 512];

const favicon = () => {
    sizing.forEach((size) => gulp.src(`${paths.srcResourcesFolder}/favicons/*.png`)
        .pipe(imageResize({
            width: size,
            height: size,
            upscale: false,
        }))
        .pipe(rename({
            prefix: '',
            suffix: `-${size}x${size}`,
        }))
        .pipe(imagemin([
            imagemin.optipng({
                optimizationLevel: 5,
            }),
        ]))
        .pipe(gulp.dest(`${paths.buildResourcesFolder}/favicons/`)));

    return gulp.src(`${paths.srcResourcesFolder}/favicons/*.png`)
        .pipe(ico('favicon.ico', { resize: true, sizes: [16, 32] }))
        .pipe(gulp.dest(`${paths.buildResourcesFolder}/favicons/`));
};

const faviconSVG = () => gulp.src(`${paths.srcResourcesFolder}/favicons/*.svg`)
    .pipe(gulp.dest(`${paths.buildResourcesFolder}/favicons/`));

// manifest
const manifest = () => gulp.src(`${paths.srcResourcesFolder}/manifest/**`)
    .pipe(gulp.dest(`${paths.buildResourcesFolder}/manifest`));

// images
const images = () => gulp.src(`${paths.srcImgFolder}/**.{jpg,png,jpeg,gif,svg}`)
    .pipe(plumber(
        notify.onError({
            title: 'IMAGES',
            message: 'Error: <%= error.message %>',
        }),
    ))
    // .pipe(newer(paths.buildImgFolder))
    .pipe(imagemin([
        imagemin.gifsicle({
            optimizationLevel: 3,
            interlaced: true,
        }),
        imagemin.optipng({
            optimizationLevel: 5,
        }),
        imageminZopfli({
            more: true,
        }),
        imagemin.mozjpeg({
            quality: 90,
            progressive: true,
        }),
        imagemin.svgo({
            plugins: [
                { removeViewBox: false },
                { removeUnusedNS: false },
                { removeUselessStrokeAndFill: false },
                { cleanupIDs: false },
                { removeComments: true },
                { removeEmptyAttrs: true },
                { removeEmptyText: true },
                { collapseGroups: true },
            ],
        }),
    ], {
        verbose: true,
    }))
    .pipe(gulp.dest(paths.buildImgFolder));

// webp format
const webpImages = () => gulp.src([`${paths.srcImgFolder}/**.{jpg,jpeg,png}`])
    // .pipe(newer(paths.buildImgFolder))
    .pipe(webp(imageminWebp({
        lossless: true,
        quality: 100,
        alphaQuality: 100,
        method: 6,
    })))
    .pipe(gulp.dest(paths.buildImgFolder));

// avif format
const avifImages = () => gulp.src([`${paths.srcImgFolder}/**.{jpg,jpeg,png}`])
    // .pipe(newer(paths.buildImgFolder))
    .pipe(avif(imageminAvif({
        quality: 100,
        lossless: true,
        speed: 0,
    })))
    .pipe(gulp.dest(paths.buildImgFolder));

// html include modules
const htmlInclude = () => gulp.src([`${srcFolder}/views/**/*.html`])
    .pipe(fileInclude({
        prefix: '@',
        basepath: '@file',
    }))
    .pipe(typograf({
        // https://github.com/typograf/typograf/blob/dev/docs/LOCALES.en-US.md
        locale: ['ru', 'en-US', 'uk'],
    }))
    .pipe(gulp.dest(buildFolder))
    .pipe(browserSync.stream());

// html minify
const htmlMinify = () => gulp.src(`${buildFolder}/**/*.html`)
    .pipe(htmlmin({
        collapseWhitespace: true,
    }))
    .pipe(gulp.dest(buildFolder));

const watchFiles = () => {
    browserSync.init({
        server: './dist',
        notify: true,
    });

    gulp.watch(paths.srcScss, styles);
    gulp.watch(`${paths.srcModulesFolder}/**/*.scss`, styles);
    gulp.watch(paths.srcFullJs, gulp.series(scripts, scriptsLibrary));
    gulp.watch(`${paths.srcModulesFolder}/**/*.js`, scripts);
    gulp.watch(`${paths.srcModulesFolder}/**/*.html`, htmlInclude);
    gulp.watch(`${srcFolder}/views/**/*.html`, htmlInclude);
    gulp.watch(`${paths.srcResourcesFolder}/fonts/**`, fonts);
    gulp.watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png,gif,svg}`, images);
    gulp.watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png}`, webpImages);
    gulp.watch(`${paths.srcImgFolder}/**/**.{jpg,jpeg,png}`, avifImages);
    gulp.watch(paths.srcSprites, svgSprites);
    gulp.watch(`${paths.srcResourcesFolder}/favicons/**`, gulp.series(favicon, faviconSVG));
    gulp.watch(`${paths.srcResourcesFolder}/manifest/**`, manifest);
};

const zipFiles = () => {
    del.sync([`${buildFolder}/*.zip`]);
    return gulp.src(`${buildFolder}/**/*.*`, {})
        .pipe(plumber(
            notify.onError({
                title: 'ZIP',
                message: 'Error: <%= error.message %>',
            }),
        ))
        .pipe(zip(`${rootFolder}.zip`))
        .pipe(gulp.dest(buildFolder));
};

const toProd = (done) => {
    isProd = true;
    done();
};

// functions

export const dev = gulp.series(clean, htmlInclude, scripts, scriptsLibrary, styles, fonts, favicon, faviconSVG, manifest, images, webpImages, avifImages, svgSprites, watchFiles);
export const build = gulp.series(toProd, clean, htmlInclude, scripts, scriptsLibrary, styles, fonts, favicon, faviconSVG, manifest, images, webpImages, avifImages, svgSprites, htmlMinify);
export const archive = zipFiles;
