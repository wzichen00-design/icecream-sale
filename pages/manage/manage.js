const app = getApp();

Page({
  data: {
    products: [],
    loading: true,
    hasPermission: false,
    checking: true,
    editingProduct: null,
    showEditModal: false,
    editForm: {
      name: '',
      spec: '',
      description: '',
      category: '',
      existingImages: [],
      newImages: []
    },
    categories: ['雪糕', '冰淇淋', '冰棍', '其他'],
    searchKeyword: '',
    currentCategory: '',
    page: 0,
    pageSize: 20,
    hasMore: true,
    loadingMore: false
  },

  searchTimer: null,

  onLoad: function () {
    this.checkPermission();
  },

  onUnload: function () {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },

  onShow: function () {
    if (this.data.hasPermission) {
      this.loadProducts();
    }
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore && this.data.hasPermission) {
      this.loadMore();
    }
  },

  checkPermission: async function () {
    this.setData({ checking: true });
    try {
      const isAdmin = await app.checkAdminPermission();
      this.setData({ 
        hasPermission: isAdmin,
        checking: false 
      });
      
      if (isAdmin) {
        this.loadProducts();
      }
    } catch (err) {
      console.error('权限检查失败：', err);
      this.setData({ 
        hasPermission: false,
        checking: false 
      });
    }
  },

  formatTime: function (date) {
    if (!date) return '';
    let d;
    if (typeof date === 'object' && date.$date) {
      d = new Date(date.$date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  loadProducts: function () {
    this.setData({ loading: true, page: 0, hasMore: true });
    
    const db = wx.cloud.database();
    let query = db.collection('products');
    
    if (this.data.currentCategory) {
      query = query.where({ category: this.data.currentCategory });
    }
    
    if (this.data.searchKeyword) {
      query = query.where({
        name: db.RegExp({
          regexp: this.data.searchKeyword,
          options: 'i'
        })
      });
    }
    
    query
      .orderBy('createTime', 'desc')
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const products = res.data.map(item => ({
          ...item,
          createTimeFormatted: this.formatTime(item.createTime)
        }));
        this.setData({ 
          products: products,
          loading: false,
          hasMore: res.data.length >= this.data.pageSize,
          page: 1
        });
      })
      .catch(err => {
        console.error('加载商品失败：', err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  loadMore: function () {
    if (!this.data.hasMore || this.data.loadingMore) return;
    
    this.setData({ loadingMore: true });
    
    const db = wx.cloud.database();
    let query = db.collection('products');
    
    if (this.data.currentCategory) {
      query = query.where({ category: this.data.currentCategory });
    }
    
    if (this.data.searchKeyword) {
      query = query.where({
        name: db.RegExp({
          regexp: this.data.searchKeyword,
          options: 'i'
        })
      });
    }
    
    query
      .orderBy('createTime', 'desc')
      .skip(this.data.page * this.data.pageSize)
      .limit(this.data.pageSize)
      .get()
      .then(res => {
        const newProducts = res.data.map(item => ({
          ...item,
          createTimeFormatted: this.formatTime(item.createTime)
        }));
        this.setData({ 
          products: [...this.data.products, ...newProducts],
          loadingMore: false,
          hasMore: res.data.length >= this.data.pageSize,
          page: this.data.page + 1
        });
      })
      .catch(err => {
        console.error('加载更多失败：', err);
        this.setData({ loadingMore: false });
      });
  },

  onSearchInput: function (e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.setData({ page: 0, hasMore: true });
      this.loadProducts();
    }, 500);
  },

  clearSearch: function () {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.setData({ searchKeyword: '' });
    this.loadProducts();
  },

  onCategoryFilter: function (e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category === this.data.currentCategory ? '' : category });
    this.loadProducts();
  },

  deleteProduct: function (e) {
    const product = e.currentTarget.dataset.product;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${product.name}」吗？此操作不可恢复。`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.doDelete(product);
        }
      }
    });
  },

  doDelete: async function (product) {
    wx.showLoading({ title: '删除中...', mask: true });
    try {
      const db = wx.cloud.database();
      await db.collection('products').doc(product._id).remove();
      
      if (product.fileIDs && product.fileIDs.length > 0) {
        await wx.cloud.deleteFile({ fileList: product.fileIDs }).catch(() => {});
      }
      
      wx.hideLoading();
      wx.showToast({ title: '删除成功', icon: 'success' });
      
      const products = this.data.products.filter(p => p._id !== product._id);
      this.setData({ products });
    } catch (err) {
      wx.hideLoading();
      console.error('删除失败：', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  showEditModal: function (e) {
    const product = e.currentTarget.dataset.product;
    const existingImages = (product.fileIDs || [product.fileID]).filter(img => img);
    
    this.setData({
      editingProduct: product,
      showEditModal: true,
      editForm: {
        name: product.name,
        spec: product.spec,
        description: product.description || '',
        category: product.category || '',
        existingImages: existingImages,
        newImages: []
      }
    });
  },

  hideEditModal: function () {
    this.setData({ showEditModal: false, editingProduct: null });
  },

  preventBubble: function () {
  },

  onEditInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`editForm.${field}`]: e.detail.value
    });
  },

  onCategoryChange: function (e) {
    this.setData({
      'editForm.category': this.data.categories[e.detail.value]
    });
  },

  getAllImages: function() {
    const { existingImages, newImages } = this.data.editForm;
    return [...existingImages, ...newImages];
  },

  chooseEditImage: function () {
    const totalImages = this.data.editForm.existingImages.length + this.data.editForm.newImages.length;
    const maxCount = 9 - totalImages;
    
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
        const newImages = tempFiles.map(file => file.tempFilePath);
        this.setData({
          'editForm.newImages': [...this.data.editForm.newImages, ...newImages]
        });
      }
    });
  },

  deleteEditImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const { existingImages, newImages } = this.data.editForm;
    const existingCount = existingImages.length;
    
    if (index < existingCount) {
      const newExistingImages = [...existingImages];
      newExistingImages.splice(index, 1);
      this.setData({
        'editForm.existingImages': newExistingImages
      });
    } else {
      const newIndex = index - existingCount;
      const newNewImages = [...newImages];
      newNewImages.splice(newIndex, 1);
      this.setData({
        'editForm.newImages': newNewImages
      });
    }
  },

  previewEditImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const allImages = this.getAllImages();
    wx.previewImage({
      current: allImages[index],
      urls: allImages
    });
  },

  compressImage: function (tempFilePath) {
    return new Promise((resolve) => {
      wx.compressImage({
        src: tempFilePath,
        quality: 80,
        success: res => resolve(res.tempFilePath),
        fail: () => resolve(tempFilePath)
      });
    });
  },

  uploadNewImages: async function () {
    const newImages = this.data.editForm.newImages;
    if (newImages.length === 0) return [];
    
    const uploadPromises = [];
    
    for (let i = 0; i < newImages.length; i++) {
      const tempFilePath = newImages[i];
      const compressedPath = await this.compressImage(tempFilePath);
      const cloudPath = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}.jpg`;
      
      const promise = wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: compressedPath
      }).then(res => res.fileID);
      
      uploadPromises.push(promise);
    }
    
    return Promise.all(uploadPromises);
  },

  submitEdit: async function () {
    const { editForm, editingProduct } = this.data;
    const totalImages = editForm.existingImages.length + editForm.newImages.length;
    
    if (!editForm.name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    
    if (!editForm.spec.trim()) {
      wx.showToast({ title: '请输入商品规格', icon: 'none' });
      return;
    }
    
    if (totalImages === 0) {
      wx.showToast({ title: '请至少保留一张图片', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '保存中...', mask: true });
    
    try {
      const newFileIDs = await this.uploadNewImages();
      
      const originalFileIDs = editingProduct.fileIDs || [editingProduct.fileID].filter(img => img);
      const deletedFileIDs = originalFileIDs.filter(
        img => img && !editForm.existingImages.includes(img)
      );
      
      if (deletedFileIDs.length > 0) {
        await wx.cloud.deleteFile({ fileList: deletedFileIDs }).catch(() => {});
      }
      
      const allFileIDs = [...editForm.existingImages, ...newFileIDs];
      
      const db = wx.cloud.database();
      await db.collection('products').doc(editingProduct._id).update({
        data: {
          name: editForm.name.trim(),
          spec: editForm.spec.trim(),
          description: editForm.description.trim(),
          category: editForm.category,
          fileID: allFileIDs[0],
          fileIDs: allFileIDs,
          updateTime: db.serverDate()
        }
      });
      
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.hideEditModal();
      this.loadProducts();
    } catch (err) {
      wx.hideLoading();
      console.error('保存失败：', err);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  goToAddProduct: function () {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  }
});
