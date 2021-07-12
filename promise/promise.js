class Promise {
  constructor (executor) {
    // 参数校验
    if (typeof executor !== 'function') {
      throw new TypeError(`Promise resolver ${executor} is not a function`)
    }

    this.initValue()
    this.initBind()

    try {
      executor(this.resolve, this.reject)
    } catch (e) {
      this.reject(e)
    }
  }

  // 绑定this
  initBind () {
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)
  }

  // 定义初始化值
  initValue () {
    this.value = null // 终值
    this.reason = null // 拒因
    this.state = Promise.PENDING // 状态
    this.onFulfilledCallbacks = [] // 成功回调
    this.onRejectedCallbacks = [] // 失败回调
  }

  resolve (value) {
    if (this.state === Promise.PENDING) { // 成功后改变promise的状态并执行回调
      this.state = Promise.FULFILLED
      this.value = value
      this.onFulfilledCallbacks.forEach(fn => fn(this.value))
    }
  }

  reject (reason) {
    if (this.state === Promise.PENDING) {
      this.state = Promise.REJECTED
      this.reason = reason
      this.onRejectedCallbacks.forEach(fn => fn(this.value))
    }
  }

  then (onFulfilled, onRejected) {
    if (typeof onFulfilled !== 'function') { // 实现promise值传递
      onFulfilled = function (value) {
        return value
      }
    }

    if (typeof onRejected !== 'function') {
      onRejected = function (reason) {
        throw reason
      }
    }

    // 实现链式调用且改变了后面then的值，必须通过新的实例
    let promise2 = new Promise((resolve, reject) => {
      if (this.state === Promise.FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value)
            Promise.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
  
      if (this.state === Promise.REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason)
            Promise.resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
  
      if (this.state === Promise.PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value)
              Promise.resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason)
              Promise.resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
        })
      }
    })

    return promise2
  }
}

Promise.PENDING = 'pending'
Promise.FULFILLED = 'fulfilled'
Promise.REJECTED = 'rejected'

Promise.resolvePromise = function (promise2, x, resolve, reject) {
  if (promise2 === x) { // 避免循环调用
    reject(new TypeError('Chaining cycle detected for promise'))
  }

  let called = false

  if (x instanceof Promise) {
    x.then(value => {
      Promise.resolvePromise(promise2, value, resolve, reject)
    }, reason => {
      reject(reason)
    })
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try { // 处理x.then的异常
      const then = x.then
      if (typeof then === 'function') {
        then.call(
          x,
          value => {
          if (called) return
          called = true
          Promise.resolvePromise(promise2, value, resolve, reject)
        }, reason => {
          if (called) return
          called = true
          reject(reason)
        })
      } else {
        if (called) return
        called = true
        resolve(x)
      } 
    } catch (e) {
      if (called) return
      called = true
      reject(e)
    }
  } else {
    if (called) return
    called = true
    resolve(x)
  }
}

Promise.defer = Promise.deferred = function () {
  let dfd = {}
  dfd.promise = new Promise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

module.exports = Promise