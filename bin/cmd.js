#!/usr/bin/env node

const program = require('commander')
const compile = require('../')
const {join: joinPath} = require('path')
const {bold} = require('chalk')
const {tick} = require('figures-colored')

const args = program
  .arguments('[src] [dest]')
  .on('--help', () => {
    const spacer = '\n    '
    const output = `  Defaults:\n${spacer}${[
      '[src]  ./src',
      '[dest] ./build'
    ].join(spacer)}`
    console.log(output)
  })
  .option(
    '-e, --entry <path>',
    'you may specify this argument multiple times',
    (val, arr) => arr.push(val) && arr,
    []
  )
  .option('-v, --verbose', 'additional console logging')
  .parse(process.argv)

;['src', 'dest'].forEach((name, idx) => args[name] = args.args[idx])
if (!args.src) {
  args.src = 'src'
}
if (!args.dest) {
  args.dest = 'build'
}

console.log(bold('Transpiling application...'))
compile(args).then(() => {
  console.log(bold(`Transpile successful ${tick}`))
})
