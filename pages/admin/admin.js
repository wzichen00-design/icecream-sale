const app = getApp();

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
    categories: ['请选择分类', '雪糕', '冰淇淋', '冰棍', '其他'],
    categoryIndex: 0
  },

  onLoad: function () {
    this.checkPermission();
  },

  checkPermission: async function () {
    this.setData({ checking: true });
    try {
      const isAdmin = await app.checkAdminPermission();
      if (!isAdmin) {
        this.setData({ hasPermission: false, checking: false });
        wx.showModal({
          title: '无权限',
          content: '您不是管理员，无法访问此页面',
          showCancel: false,
          success: () => {
            wx.switchTab({ url: '/pages/index/index' });
          }
        });
      } else {
        this.setData({ hasPermission: true, checking: false });
      }
    } catch (err) {
      console.error('权限检查失败：', err);
      this.setData({ hasPermission: false, checking: false });
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onInputChange: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onCategoryChange: function (e) {
    const index = e.detail.value;
    if (index === 0) {
      this.setData({
        categoryIndex: index,
        category: ''
      });
    } else {
      this.setData({
        categoryIndex: index,
        category: this.data.categories[index]
      });
    }
  },

  chooseImage: function () {
    const maxCount = 9 - this.data.imageList.length;
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        const newImages = tempFiles.map(file => ({
          tempFilePath: file.tempFilePath,
          uploading: false,
          fileID: null
        }));
        this.setData({ imageList: [...this.data.imageList, ...newImages] });
      }
    });
  },

  deleteImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const imageList = this.data.imageList;
    imageList.splice(index, 1);
    this.setData({ imageList });
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.imageList.map(img => img.tempFilePath || img.fileID);
    wx.previewImage({ current: url, urls: urls });
  },

  compressImage: function (tempFilePath) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: tempFilePath,
        quality: 80,
        success: res => resolve(res.tempFilePath),
        fail: err => resolve(tempFilePath)
      });
    });
  },

  uploadImages: async function () {
    const imageList = this.data.imageList;
    const uploadPromises = [];
    
    for (let i = 0; i < imageList.length; i++) {
      const img = imageList[i];
      if (img.fileID) continue;
      
      const compressedPath = await this.compressImage(img.tempFilePath);
      const cloudPath = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}.jpg`;
      
      const promise = wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: compressedPath
      }).then(res => {
        imageList[i].fileID = res.fileID;
        return res.fileID;
      });
      
      uploadPromises.push(promise);
    }
    
    return Promise.all(uploadPromises);
  },

  submitProduct: async function () {
    const { name, description, spec, imageList, category } = this.data;
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    
    if (!spec.trim()) {
      wx.showToast({ title: '请输入商品规格', icon: 'none' });
      return;
    }
    
    if (imageList.length === 0) {
      wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...', mask: true });

    try {
      await this.uploadImages();
      const fileIDs = this.data.imageList.map(img => img.fileID).filter(id => id);
      
      const db = wx.cloud.database();
      await db.collection('products').add({
        data: {
          name: name.trim(),
          description: description.trim(),
          spec: spec.trim(),
          category: category,
          fileID: fileIDs[0],
          fileIDs: fileIDs,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });

      wx.hideLoading();
      wx.showToast({ 
        title: '发布成功', 
        icon: 'success',
        duration: 1500
      });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/manage/manage' });
      }, 1500);
      
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败：', err);
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
