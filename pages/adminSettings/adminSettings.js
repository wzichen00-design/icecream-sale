const app = getApp()
const { adminService } = require('../../utils/api')
const { showError, showSuccess, showLoading, hideLoading, showConfirm } = require('../../utils/util')

Page({
  data: {
    adminList: [],
    loading: true,
    currentOpenid: '',
    newOpenid: '',
    isAdmin: false
  },

  onLoad: function () {
    this.loadAdminList()
  },

  loadAdminList: async function () {
    try {
      const checkResult = await adminService.check()
      const listResult = await adminService.list()

      this.setData({
        adminList: listResult.adminList || [],
        currentOpenid: checkResult.openid,
        isAdmin: checkResult.isAdmin,
        loading: false
      })
    } catch (err) {
      console.error('加载管理员列表失败：', err)
      this.setData({ loading: false })
      showError('加载失败')
    }
  },

  onInputChange: function (e) {
    this.setData({ newOpenid: e.detail.value })
  },

  copyOpenid: function () {
    wx.setClipboardData({
      data: this.data.currentOpenid,
      success: () => {
        showSuccess('已复制到剪贴板')
      }
    })
  },

  addAdmin: async function () {
    const openid = this.data.newOpenid.trim()

    if (!openid) {
      showError('请输入要添加的 openid')
      return
    }

    if (this.data.adminList.includes(openid)) {
      showError('该用户已是管理员')
      return
    }

    showLoading('添加中...')

    try {
      const result = await adminService.add(openid)
      hideLoading()
      showSuccess('添加成功')

      this.setData({
        adminList: result.adminList,
        newOpenid: ''
      })
    } catch (err) {
      hideLoading()
      showError(err.message || '添加失败')
    }
  },

  removeAdmin: async function (e) {
    const openid = e.currentTarget.dataset.openid

    if (openid === this.data.currentOpenid) {
      showError('不能移除自己')
      return
    }

    const confirmed = await showConfirm('确认移除', '确定要移除该管理员吗？')

    if (!confirmed) return

    showLoading('移除中...')

    try {
      const result = await adminService.remove(openid)
      hideLoading()
      showSuccess('移除成功')

      this.setData({
        adminList: result.adminList
      })
    } catch (err) {
      hideLoading()
      showError(err.message || '移除失败')
    }
  },

  initAdmin: async function () {
    showLoading('初始化中...')

    try {
      const result = await adminService.init()
      hideLoading()
      showSuccess(result.message)

      this.setData({
        adminList: result.adminList
      })
    } catch (err) {
      hideLoading()
      showError(err.message || '初始化失败')
    }
  }
})
