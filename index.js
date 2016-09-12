const gulp = require('gulp')
const babel = require('gulp-babel')
const sourcemaps = require('gulp-sourcemaps')
const merge = require('merge-stream')
const injectBundle = require('./lib/inject-bundle')
const {join: joinPath, relative: getRelativePath} = require('path')
const {statAsync: stat} = require('fs-extra-promise')

module.exports = function(src, dest, entries = 'index.js') {
  return stat(src).then(stats => {
    return stats.isDirectory()
  }).then(is => {
    if (!is) { throw new Error(`${src} is not a directory`) }
    if (!getRelativePath(src, dest).length) { throw new Error('"dest" cannot be the "src" directory') }
    return new Promise((resolve, reject) => {
      const presets = [
        require('babel-preset-stage-2'),
        require('babel-preset-node6'),
        require('babel-preset-flow')
      ]
      const plugins = [
        require('babel-plugin-transform-strict-mode'),
        [require('babel-plugin-root-require'), {
          projectRoot: src
        }]
      ]

      const jsSrc = '**/*.{js,jsx,es6,es}'
      const jsStream = gulp.src(jsSrc, {cwd: src})
        .pipe(sourcemaps.init())
        .pipe(babel({
          presets,
          plugins
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dest))

      const otherStream = gulp.src([src + '/**/*', '!' + jsSrc], {cwd: src, base: src})
        .pipe(gulp.dest(dest))

      return merge(jsStream, otherStream)
        .on('error', reject)
        .on('end', resolve)
    })
  }).then(() => {
    return injectBundle(__dirname + '/lib/source-map-support-register.bundle.js', dest, entries)
  })
}
