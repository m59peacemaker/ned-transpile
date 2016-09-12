#!/usr/bin/env node

const program = require('commander')
const compile = require('../')

const args = program
  .arguments('<src> <dest>')
  .option(
    '-e, --entry <path>',
    'you may specify this argument multiple times',
    (val, arr) => arr.push(val) && arr,
    []
  )
  .parse(process.argv)

;['src', 'dest'].forEach((name, idx) => args[name] = args.args[idx])

compile(args.src, args.dest, args.entries)
