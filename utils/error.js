const ERROR_CODES = {
  PERMISSION_DENIED: {
    code: 'PERMISSION_DENIED',
    message: '无权限执行此操作'
  },
  INVALID_PARAM: {
    code: 'INVALID_PARAM',
    message: '参数错误'
  },
  UNKNOWN_ACTION: {
    code: 'UNKNOWN_ACTION',
    message: '未知操作'
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: '服务器内部错误'
  },
  CLOUD_FUNCTION_ERROR: {
    code: 'CLOUD_FUNCTION_ERROR',
    message: '云函数调用失败'
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: '网络连接失败，请检查网络后重试'
  },
  UPLOAD_ERROR: {
    code: 'UPLOAD_ERROR',
    message: '文件上传失败'
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    message: '资源不存在'
  }
}

const getErrorMessage = function (error) {
  if (!error) {
    return '未知错误'
  }

  if (error.message) {
    return error.message
  }

  if (error.code && ERROR_CODES[error.code]) {
    return ERROR_CODES[error.code].message
  }

  return '操作失败，请稍后重试'
}

const handleError = function (error, showTip = true) {
  console.error('Error:', error)

  const message = getErrorMessage(error)

  if (showTip) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  }

  return message
}

const withRetry = function (fn, maxRetries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0

    const attempt = function () {
      fn()
        .then(resolve)
        .catch((error) => {
          retries++
          if (retries < maxRetries) {
            console.log(`重试第 ${retries} 次...`)
            setTimeout(attempt, delay)
          } else {
            reject(error)
          }
        })
    }

    attempt()
  })
}

const withTimeout = function (promise, timeout = 10000) {
  return Promise.race([
    promise,
    new Promise((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error('请求超时'))
      }, timeout)
    })
  ])
}

module.exports = {
  ERROR_CODES,
  getErrorMessage,
  handleError,
  withRetry,
  withTimeout
}
