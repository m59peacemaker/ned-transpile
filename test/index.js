const test = require('tape')
const rimraf = require('rimraf')
const fs = require('fs')
const readFileSync = fs.readFileSync
const reloadRequire = require('require-reload')(require)
const compile = require('../')

const fixtures = __dirname + '/fixtures'
const tmpDir = '/tmp/compile-js'

const fixture = name => fixtures + '/' + name

const resetState = () => rimraf.sync(tmpDir)

test('throws when "src" does not exist', t => {
  t.plan(1)
  compile(fixture('ded'), tmpDir)
    .then(t.fail)
    .catch(t.pass)
})

test('throws when "src" is not a directory', t => {
  t.plan(1)
  compile(fixture('this-is-a-file'), tmpDir)
    .then(t.fail)
    .catch(t.pass)
})

test('throws when "dest" is the "src" directory', t => {
  t.plan(1)
  compile(fixture('args'), fixture('args/'))
    .then(t.fail)
    .catch(t.pass)
})

test('copies js', t => {
  t.plan(1)
  compile(fixture('copies-js'), tmpDir)
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
  t.plan(1)
  compile(fixture('copies-all'), tmpDir)
    .then(() => {
      const result = readFileSync(tmpDir + '/css/app.css', 'utf8')
      resetState()
      t.equal(result, 'body { }\n')
    })
    .catch(err => {
      resetState()
      t.fail(err)
    })
})

test('compiles async/await', t => {
  t.plan(1)
  compile(fixture('async-await'), tmpDir)
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

test('compiles flow types', t => {
  t.plan(1)
  compile(fixture('flow'), tmpDir)
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
  compile(fixture('root-require'), tmpDir)
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
  compile(fixture('trailing-function-comma'), tmpDir)
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
  compile(fixture('es6-modules'), tmpDir)
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
  compile(fixture('root-import'), tmpDir)
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

test('forces strict mode', t => {
  t.plan(1)
  compile(fixture('strict-mode'), tmpDir)
    .then(() => {
      reloadRequire(tmpDir)
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
  compile(fixture('source-maps'), tmpDir)
    .then(() => {
      reloadRequire(tmpDir)
      resetState()
      t.fail('required module is supposed to throw')
    })
    .catch((err) => {
      err.stack // `err.stack` is a getter. It has to be accessed before removing the files.
      resetState()
      t.true(err.stack.split('\n')[1].indexOf('/index.js:10') !== -1)
    })
})

test('array of entries all get sourcemap support', t => {
  t.plan(2)
  const entries = ['index.js', 'nest/entry.js']
  compile(fixture('source-maps'), tmpDir, entries)
    .then(() => {
      entries.forEach((entry, idx) => {
        try {
          reloadRequire(tmpDir + '/' + entry)
          t.fail('required module is supposed to throw')
        } catch (err) {
          err.stack // `err.stack` is a getter. It has to be accessed before removing the files.
          const expectedInLine = idx === 0 ? '/index.js:10' : '/nest/entry.js:2'
          const line = err.stack.split('\n')[1]
          t.true(line.indexOf(expectedInLine) !== -1, line)
        }
      })
      resetState()
    })
})
