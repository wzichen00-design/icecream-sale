const app = getApp()
const { productService } = require('../../utils/api')
const { showError, showSuccess, showLoading, hideLoading, CATEGORIES, MAX_IMAGES, uploadImages, chooseImages, previewImages } = require('../../utils/util')

Page({
  data: {
    name: '',
    description: '',
    spec: '',
    imageList: [],
    submitting: false,
    hasPermission: false,
    checking: true,
    category: '',
    categories: CATEGORIES.filter(c => c !== '全部'),
    categoryIndex: 0
  },

  onLoad: function () {
    this.checkPermission()
  },

  checkPermission: async function () {
    this.setData({ checking: true })
    try {
      const isAdmin = await app.checkAdminPermission()
      if (!isAdmin) {
        this.setData({ hasPermission: false, checking: false })
        wx.showModal({
          title: '无权限',
          content: '您不是管理员，无法访问此页面',
          showCancel: false,
          success: () => {
            wx.switchTab({ url: '/pages/index/index' })
          }
        })
      } else {
        this.setData({ hasPermission: true, checking: false })
      }
    } catch (err) {
      console.error('权限检查失败：', err)
      this.setData({ hasPermission: false, checking: false })
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onInputChange: function (e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onCategoryChange: function (e) {
    const index = e.detail.value
    if (index === 0) {
      this.setData({
        categoryIndex: index,
        category: ''
      })
    } else {
      this.setData({
        categoryIndex: index,
        category: this.data.categories[index]
      })
    }
  },

  chooseImage: async function () {
    try {
      const newImages = await chooseImages(MAX_IMAGES, this.data.imageList.length)
      this.setData({ imageList: [...this.data.imageList, ...newImages] })
    } catch (err) {
      if (err.message !== '已达到最大图片数量') {
        console.error('选择图片失败：', err)
      }
    }
  },

  deleteImage: function (e) {
    const index = e.currentTarget.dataset.index
    const imageList = [...this.data.imageList]
    imageList.splice(index, 1)
    this.setData({ imageList })
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url
    previewImages(url, this.data.imageList)
  },

  submitProduct: async function () {
    const { name, description, spec, imageList, category } = this.data

    if (!name.trim()) {
      showError('请输入雪糕名称')
      return
    }

    if (!spec.trim()) {
      showError('请输入雪糕规格')
      return
    }

    if (imageList.length === 0) {
      showError('请至少上传一张图片')
      return
    }

    this.setData({ submitting: true })
    showLoading('发布中...')

    try {
      const fileIDs = await uploadImages(imageList)

      await productService.addProduct({
        name: name.trim(),
        description: description.trim(),
        spec: spec.trim(),
        category,
        fileIDs
      })

      hideLoading()
      showSuccess('发布成功')

      setTimeout(() => {
        wx.switchTab({ url: '/pages/manage/manage' })
      }, 1500)
    } catch (err) {
      hideLoading()
      console.error('发布失败：', err)
      showError(err.message || '发布失败，请重试')
      this.setData({ submitting: false })
    }
  }
})
