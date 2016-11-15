const test = require('tape')
const {readFileSync} = require('fs')
const {removeSync} = require('fs-extra-promise')
const {exec} = require('child_process')
const {join: joinPath} = require('path')
const reloadRequire = require('require-reload')(require)
const compile = require('../')

const fixtures = __dirname + '/fixtures'
const tmpDir = '/tmp/compile-js'

const fixture = name => fixtures + '/' + name

const resetState = () => removeSync(tmpDir)

test('throws when "src" does not exist', t => {
  t.plan(1)
  compile({src: fixture('ded'), dest: tmpDir})
    .then(t.fail)
    .catch(t.pass)
})

test('throws when "src" is not a directory', t => {
  t.plan(1)
  compile({src: fixture('this-is-a-file'), dest: tmpDir})
    .then(t.fail)
    .catch(t.pass)
})

test('throws when "dest" is the "src" directory', t => {
  t.plan(1)
  compile({src: fixture('args'), dest: fixture('args/')})
    .then(t.fail)
    .catch(t.pass)
})

test('copies js', t => {
  t.plan(1)
  compile({src: fixture('copies-js'), dest: tmpDir})
    .then(() => {
      const result = require(tmpDir)()
      resetState()
      t.equal(result, true)
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

test('copies other files', t => {
  t.plan(2)
  compile({src: fixture('copies-all'), dest: tmpDir})
    .then(() => {
      const css = readFileSync(tmpDir + '/css/app.css', 'utf8')
      const jpg = readFileSync(tmpDir + '/foo.jpg', 'utf8')
      resetState()
      t.equal(css, 'body { }\n')
      t.equal(jpg, '123\n')
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

test('copies other files - cmd, relative paths', t => {
  exec(`${__dirname}/../bin/cmd.js test/fixtures/copies-all ${tmpDir}`, (err, stdout, stdin) => {
    try {
      if (err) {
        throw err
      }
      const css = readFileSync(tmpDir + '/css/app.css', 'utf8')
      const jpg = readFileSync(tmpDir + '/foo.jpg', 'utf8')
      resetState()
      t.equal(css, 'body { }\n')
      t.equal(jpg, '123\n')
      t.end()
    } catch (err) {
      resetState()
      t.fail(err)
      t.end()
    }
  })
})

test('compiles async/await', t => {
  t.plan(1)
  compile({src: fixture('async-await'), dest: tmpDir})
    .then(() => {
      reloadRequire(tmpDir)
      resetState()
      t.pass()
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

test('supports root require', t => {
  t.plan(1)
  compile({src: fixture('root-require'), dest: tmpDir})
    .then(() => {
      const result = reloadRequire(tmpDir)
      resetState()
      t.equal(result, true)
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

test('allows trailing function commas', t => {
  t.plan(1)
  compile({src: fixture('trailing-function-comma'), dest: tmpDir})
    .then(() => {
      const result = reloadRequire(tmpDir)
      resetState()
      t.equal(result, true)
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

test('supports es6 modules', t => {
  t.plan(1)
  compile({src: fixture('es6-modules'), dest: tmpDir})
    .catch(t.fail)
    .then(() => {
      const result = reloadRequire(tmpDir).default
      resetState()
      t.equal(result, true)
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

// works for free because imports are transformed into requires
test('supports root import', t => {
  t.plan(1)
  compile({src: fixture('root-import'), dest: tmpDir})
    .then(() => {
      const result = reloadRequire(tmpDir).default
      resetState()
      t.equal(result, true)
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

// as of node 7
// something between this and the next souremap test gets messed up if they use the same directory
// probably a problem with source-map-support or require-reload, since both are hacky
// using a different dir fixes it
test('forces strict mode', t => {
  t.plan(1)
  const dir = tmpDir + '/foo'
  compile({src: fixture('strict-mode'), dest: dir})
    .then(() => {
      require(dir)
      resetState()
      t.fail('non-strict js code did not throw!')
    })
    .catch(err => {
      resetState()
      t.pass(err)
    })
})

test('supports sourcemaps', t => {
  t.plan(1)
  compile({src: fixture('source-maps'), dest: tmpDir})
    .then(() => {
      reloadRequire(tmpDir)
      resetState()
      t.fail('required module is supposed to throw')
    })
    .catch((err) => {
      const line = err.stack.split('\n')[1]
      resetState()
      t.true(line.includes('index.js:10'), line)
    })
})
