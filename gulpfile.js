"use strict";

const sass = require("gulp-sass")(require("sass"));
const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const fileinclude = require("gulp-file-include");
const autoprefixer = require("gulp-autoprefixer");
const bs = require("browser-sync").create();
const rimraf = require("rimraf");
const comments = require("gulp-header-comment");

var deploy      = require('gulp-gh-pages');

var browserify = require('browserify');
var  babelify = require('babelify');


var source = require('vinyl-source-stream');

// /**
//  * Push build to gh-pages
//  */
// gulp.task('deploy', function () {
//   return gulp.src("./dist/**/*")
//     .pipe(deploy())
// });

var path = {
  src: {
    html: "source/*.html",
    others: "source/*.+(php|ico|png)",
    htminc: "source/partials/**/*.htm",
    incdir: "source/partials/",
    plugins: "source/plugins/**/*.*",
    js: "source/js/*.js",
    scss: "source/scss/**/*.scss",
    images: "source/images/**/*.+(png|jpg|gif|svg)",
    data: "source/data/*"
  },
  build: {
    dirBuild: "theme/",
    dirDev: "theme/",
  },
};

// gulp.task("build:import", function(){
//   return browserify({
//       entries: []
//   })
//   .transform(babelify)
//   .bundle()
//   .pipe(source('bundle.js'))
//   .pipe(gulp.dest(path.build.dirDev + "js/"))
//   .pipe(
//     bs.reload({
//       stream: true,
//     })
//   );
// });

gulp.task('browserify', function() {
  return browserify({
      entries:["source/js/script.js","source/js/scroll.js"]
  })
    .transform(babelify)
    .bundle()
    //Pass desired output filename to vinyl-source-stream
    .pipe(source('script.js'))
    // Start piping stream to tasks!
    .pipe(gulp.dest(path.build.dirDev + "js/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// HTML
gulp.task("html:build", function () {
  return gulp
    .src(path.src.html)
    .pipe(
      fileinclude({
        basepath: path.src.incdir,
      })
    )
    .pipe(
      comments(`
    WEBSITE: https://themefisher.com
    TWITTER: https://twitter.com/themefisher
    FACEBOOK: https://www.facebook.com/themefisher
    GITHUB: https://github.com/themefisher/
    `)
    )
    .pipe(gulp.dest(path.build.dirDev))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// SCSS
gulp.task("scss:build", function () {
  return gulp
    .src(path.src.scss)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ['node_modules'],
        outputStyle: "expanded",
      }).on("error", sass.logError)
    )
    .pipe(autoprefixer())
    .pipe(sourcemaps.write("/"))
    .pipe(gulp.dest(path.build.dirDev + "css/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Javascript
gulp.task("js:build", function () {
  return gulp
    .src(path.src.js)
    .pipe(
      comments(`
  WEBSITE: https://themefisher.com
  TWITTER: https://twitter.com/themefisher
  FACEBOOK: https://www.facebook.com/themefisher
  GITHUB: https://github.com/themefisher/
  `)
    )
    .pipe(gulp.dest(path.build.dirDev + "js/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Images
gulp.task("images:build", function () {
  return gulp
    .src(path.src.images)
    .pipe(gulp.dest(path.build.dirDev + "images/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

gulp.task("data:build", function () {
  return gulp
    .src(path.src.data)
    .pipe(gulp.dest(path.build.dirDev + "data/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Plugins
gulp.task("plugins:build", function () {
  return gulp
    .src(path.src.plugins)
    .pipe(gulp.dest(path.build.dirDev + "plugins/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
});

// Other files like favicon, php, sourcele-icon on root directory
gulp.task("others:build", function () {
  return gulp.src(path.src.others).pipe(gulp.dest(path.build.dirDev));
});

// Clean Build Folder
gulp.task("clean", function (cb) {
  rimraf("./theme", cb);
});

// Watch Task
gulp.task("watch:build", function () {
  gulp.watch(path.src.html, gulp.series("html:build"));
  gulp.watch(path.src.htminc, gulp.series("html:build"));
  gulp.watch(path.src.scss, gulp.series("scss:build"));
  gulp.watch(path.src.js, gulp.series('browserify'));
  gulp.watch(path.src.images, gulp.series("images:build"));
  gulp.watch(path.src.data, gulp.series("data:build"));
  gulp.watch(path.src.plugins, gulp.series("plugins:build"));
});

// Dev Task
gulp.task(
  "default",
  gulp.series(
    "clean",
    "html:build",
    // "build:import",
    'browserify',
    "scss:build",
    "images:build",
    "data:build",
    "plugins:build",
    "others:build",
    gulp.parallel("watch:build", function () {
      bs.init({
        server: {
          baseDir: path.build.dirDev,
        },
      });
    })
  )
);

// Build Task
gulp.task(
  "build",
  gulp.series(
    "html:build",
    // "build:import",
    'browserify',
    "scss:build",
    "images:build",
    "data:build",
    "plugins:build"
  )
);

