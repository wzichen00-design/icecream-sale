const formatTime = function (date) {
  if (!date) return ''

  let d
  if (typeof date === 'object' && date.$date) {
    d = new Date(date.$date)
  } else if (date instanceof Date) {
    d = date
  } else {
    d = new Date(date)
  }

  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hour = d.getHours().toString().padStart(2, '0')
  const minute = d.getMinutes().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

const debounce = function (fn, delay = 500) {
  let timer = null

  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

const throttle = function (fn, delay = 300) {
  let lastTime = 0

  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

const showError = function (message, duration = 2000) {
  wx.showToast({
    title: message,
    icon: 'none',
    duration
  })
}

const showSuccess = function (message, duration = 1500) {
  wx.showToast({
    title: message,
    icon: 'success',
    duration
  })
}

const showLoading = function (message = '加载中...') {
  wx.showLoading({
    title: message,
    mask: true
  })
}

const hideLoading = function () {
  wx.hideLoading()
}

const showConfirm = function (title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

const CATEGORIES = ['全部', '雪糕', '冰淇淋', '冰棍', '其他']

const PAGE_SIZE = 10

const MAX_IMAGES = 9

const IMAGE_QUALITY = 80

const compressImage = function (tempFilePath) {
  return new Promise((resolve) => {
    wx.compressImage({
      src: tempFilePath,
      quality: IMAGE_QUALITY,
      success: res => resolve(res.tempFilePath),
      fail: () => resolve(tempFilePath)
    })
  })
}

const uploadImages = async function (imageList, folder = 'products') {
  const uploadPromises = []
  const fileIDs = []

  for (let i = 0; i < imageList.length; i++) {
    const tempFilePath = imageList[i]
    const compressedPath = await compressImage(tempFilePath)
    const cloudPath = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}.jpg`

    const promise = wx.cloud.uploadFile({
      cloudPath,
      filePath: compressedPath
    }).then(res => {
      fileIDs.push(res.fileID)
      return res.fileID
    })

    uploadPromises.push(promise)
  }

  await Promise.all(uploadPromises)
  return fileIDs
}

const chooseImages = function (maxCount, currentCount = 0) {
  return new Promise((resolve, reject) => {
    const remaining = maxCount - currentCount
    if (remaining <= 0) {
      showError('最多上传' + maxCount + '张图片')
      reject(new Error('已达到最大图片数量'))
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(file => file.tempFilePath)
        resolve(tempFiles)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

const previewImages = function (current, urls) {
  wx.previewImage({
    current,
    urls
  })
}

module.exports = {
  formatTime,
  debounce,
  throttle,
  showError,
  showSuccess,
  showLoading,
  hideLoading,
  showConfirm,
  compressImage,
  uploadImages,
  chooseImages,
  previewImages,
  CATEGORIES,
  PAGE_SIZE,
  MAX_IMAGES,
  IMAGE_QUALITY
}
