const Promise = require('./promise')

console.log(1)

new Promise((resolve, reject) => {
  return new Promise((resolve) => {
    resolve(1)
  })
}).then((value) => {
  console.log('value1:', value)
}, (reason) => {
  console.log('reason1:', reason)
}).then((value) => {
  console.log('value2:', value)
}, (reason) => {
  console.log('reason2:', reason)
})

console.log(3)