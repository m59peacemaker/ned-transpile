var x = 123
var y = 'abc'

async function foo() {
  return new Promise(resolve => {
    resolve()
  })
}

throw new Error('FAIL!')
