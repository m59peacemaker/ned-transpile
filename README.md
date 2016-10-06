# ned-transpile

An opinionated and simple node project transpiler built on top of [babel](https://babeljs.io) for [ned](https://www.npmjs.com/package/ned).

Use with Node => 6.0

- provides async/await
- completes es6 support
- sourcemap support
- provides project root relative requires
- forces strict mode

## install

```
npm install ned-transpile
```

## example

```sh
cd my-project
# transpile ./src to ./build (default)
ned-transpile
```

```sh
cd my-project
ned-transpile src foo/build
```

```js
const transpile = require('ned-transpile')

transpile({
  src: srcPath,
  dest: destPath,
  entries: ['index.js', 'bin/foo.js']
}).then(() => {
  console.log('Done!')
})
```

## cli help

```sh
  Usage: ned-transpile [options] [src] [dest]

  Options:

    -h, --help          output usage information
    -e, --entry <path>  you may specify this argument multiple times
    -v, --verbose       additional console logging

  Defaults:

    [src]  ./src
    [dest] ./build
```

## API

### `transpile(options)`

- `options: object`
  - `src: string` Path to directory containing a node project to be transpiled
  - `dest: string` Path to directory where transpiled project will be output
  - `entries: [], ['index.js]` Application entry points. Defaults to `index.js`.
  - `verbose: boolean`, false` additional console logging
- **returns**: `promise`
