const {
  dirname: getDirname,
  basename: getBasename,
  relative: getRelativePath,
  join: joinPath
} = require('path')
const mkdirp = require('mkdirp-promise')
const {
  copyAsync: copy,
  statAsync: stat,
  readFileAsync: readFile,
  writeFileAsync: writeFile
} = require('fs-extra-promise')

const prependAfterUseStrict = (file, data) => {
  const regex = /^\s*("use strict")|('use strict');?/
  return readFile(file, 'utf8').then(contents => {
    if (regex.test(contents)) {
      return writeFile(file, contents.replace(regex, match => {
        return match + '\n' + data
      }))
    } else {
      return writeFile(file, contents + data)
    }
  })
}

const buildModulesName = '_build_modules'

const injectBundle = (pathToBundle, projectRoot, entries) => {
  const pathToBuildModules = joinPath(projectRoot, buildModulesName)
  const moduleName = getBasename(pathToBundle)
  const moduleDest = joinPath(pathToBuildModules, moduleName)
  return stat(pathToBundle)
    .then(() => mkdirp(pathToBuildModules))
    .then(() => copy(pathToBundle, moduleDest))
    .then(() => Promise.all(entries.map(entry => {
      const entryAbsolutePath = joinPath(projectRoot, entry)
      const requirePath = './' + getRelativePath(getDirname(entryAbsolutePath), moduleDest)
      return prependAfterUseStrict(entryAbsolutePath, `require('${requirePath}')`)
    })))
}

module.exports = injectBundle
