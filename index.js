const {join: joinPath, relative: getRelativePath} = require('path')
const {statAsync: stat} = require('fs-extra-promise')
const vfs = require('vinyl-fs')
const gulpIf = require('gulp-if')
const babel = require('gulp-babel')
const sourcemaps = require('gulp-sourcemaps')
const streamToPromise = require('stream-to-promise')
const {obj: through} = require('throo')

const logFilePaths = () => {
  return through((push, chunk, enc, cb) => {
    console.log(chunk.relative)
    cb(null, chunk)
  })
}

module.exports = ({
  src,
  dest,
  entries = ['index.js'],
  verbose = false
}) => {
  [['src', src], ['dest', dest]].forEach(([name, value]) => {
    if (typeof value !== 'string' || !value.length) {
      throw new Error(`"${name}" is required and must be a string`)
    }
  })
  return stat(src).then(stats => {
    return stats.isDirectory()
  }).then(is => {
    if (!is) { throw new Error(`${src} is not a directory`) }
    if (!getRelativePath(src, dest).length) { throw new Error('"dest" cannot be the "src" directory') }
    const plugins = [
      require('babel-plugin-transform-strict-mode'),
      require('babel-plugin-transform-es2015-modules-commonjs'),
      require('babel-plugin-syntax-trailing-function-commas'),
      require('babel-plugin-transform-async-to-generator'),
      [require('babel-plugin-root-require'), {
        projectRoot: src
      }],
      [require('babel-plugin-node-sourcemap-support'), {
        src,
        dest,
        entries
      }]
    ]

    const jsSrc = '**/*.{js,jsx,es,es6}'
    const jsStream = vfs.src(jsSrc, {cwd: src})
      .pipe(sourcemaps.init())
      .pipe(babel({
        plugins
      }))
      .pipe(gulpIf(verbose, logFilePaths()))
      .pipe(sourcemaps.write())
      .pipe(vfs.dest(dest))

    const otherStream = vfs.src(['**/*', '!' + jsSrc], {cwd: src, base: src})
      .pipe(vfs.dest(dest))

    return Promise.all([jsStream, otherStream].map(s => streamToPromise(s)))
  })
}
