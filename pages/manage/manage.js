const app = getApp();
const { productService } = require('../../utils/api');
const { formatTime, debounce, showError, showSuccess, showLoading, hideLoading, showConfirm, CATEGORIES, PAGE_SIZE, MAX_IMAGES, compressImage, previewImages } = require('../../utils/util');

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
    categories: CATEGORIES.filter(c => c !== '全部'),
    searchKeyword: '',
    currentCategory: '',
    hasMore: true,
    loadingMore: false,
    lastId: null,
    lastCreateTime: null
  },

  onLoad: function() {
    this.checkPermission();
  },

  onShow: function() {
    if (this.data.hasPermission) {
      this.loadProducts();
    }
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loadingMore && this.data.hasPermission) {
      this.loadMore();
    }
  },

  checkPermission: async function() {
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

  loadProducts: function() {
    this.setData({ 
      loading: true, 
      lastId: null, 
      lastCreateTime: null,
      hasMore: true 
    });
    
    productService.getProducts({
      category: this.data.currentCategory,
      keyword: this.data.searchKeyword,
      pageSize: PAGE_SIZE
    })
      .then(res => {
        const products = res.products.map(item => ({
          ...item,
          createTimeFormatted: formatTime(item.createTime)
        }));
        
        this.setData({ 
          products: products,
          loading: false,
          hasMore: res.hasMore,
          lastId: res.lastId,
          lastCreateTime: res.lastCreateTime
        });
      })
      .catch(err => {
        console.error('加载商品失败：', err);
        this.setData({ loading: false });
        showError('加载失败');
      });
  },

  loadMore: function() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    
    this.setData({ loadingMore: true });
    
    productService.getProducts({
      category: this.data.currentCategory,
      keyword: this.data.searchKeyword,
      lastId: this.data.lastId,
      lastCreateTime: this.data.lastCreateTime,
      pageSize: PAGE_SIZE
    })
      .then(res => {
        const newProducts = res.products.map(item => ({
          ...item,
          createTimeFormatted: formatTime(item.createTime)
        }));
        
        this.setData({ 
          products: [...this.data.products, ...newProducts],
          loadingMore: false,
          hasMore: res.hasMore,
          lastId: res.lastId,
          lastCreateTime: res.lastCreateTime
        });
      })
      .catch(err => {
        console.error('加载更多失败：', err);
        this.setData({ loadingMore: false });
        showError('加载失败');
      });
  },

  onSearchInput: function(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    this.debouncedSearch(value);
  },

  debouncedSearch: debounce(function(keyword) {
    this.setData({ 
      lastId: null, 
      lastCreateTime: null,
      hasMore: true 
    });
    this.loadProducts();
  }, 500),

  clearSearch: function() {
    this.setData({ 
      searchKeyword: '',
      lastId: null, 
      lastCreateTime: null,
      hasMore: true 
    });
    this.loadProducts();
  },

  onCategoryFilter: function(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ 
      currentCategory: category === this.data.currentCategory ? '' : category,
      lastId: null, 
      lastCreateTime: null,
      hasMore: true 
    });
    this.loadProducts();
  },

  deleteProduct: async function(e) {
    const product = e.currentTarget.dataset.product;
    const confirmed = await showConfirm('确认删除', `确定要删除「${product.name}」吗？此操作不可恢复。`);
    
    if (confirmed) {
      this.doDelete(product);
    }
  },

  doDelete: async function(product) {
    showLoading('删除中...');
    
    try {
      await productService.deleteProduct(product._id, product.fileIDs);
      
      hideLoading();
      showSuccess('删除成功');
      
      const products = this.data.products.filter(p => p._id !== product._id);
      this.setData({ products });
    } catch (err) {
      hideLoading();
      console.error('删除失败：', err);
      showError(err.message || '删除失败');
    }
  },

  showEditModal: function(e) {
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

  hideEditModal: function() {
    this.setData({ showEditModal: false, editingProduct: null });
  },

  preventBubble: function() {},

  onEditInput: function(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`editForm.${field}`]: e.detail.value
    });
  },

  onCategoryChange: function(e) {
    this.setData({
      'editForm.category': this.data.categories[e.detail.value]
    });
  },

  getAllImages: function() {
    const { existingImages, newImages } = this.data.editForm;
    return [...existingImages, ...newImages];
  },

  chooseEditImage: function() {
    const totalImages = this.data.editForm.existingImages.length + this.data.editForm.newImages.length;
    const maxCount = MAX_IMAGES - totalImages;
    
    if (maxCount <= 0) {
      showError('最多上传9张图片');
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

  deleteEditImage: function(e) {
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

  previewEditImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const allImages = this.getAllImages();
    previewImages(allImages[index], allImages);
  },

  uploadNewImages: async function() {
    const newImages = this.data.editForm.newImages;
    if (newImages.length === 0) return [];
    
    const uploadPromises = [];
    
    for (let i = 0; i < newImages.length; i++) {
      const tempFilePath = newImages[i];
      const compressedPath = await compressImage(tempFilePath);
      const cloudPath = `products/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}.jpg`;
      
      const promise = wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: compressedPath
      }).then(res => res.fileID);
      
      uploadPromises.push(promise);
    }
    
    return Promise.all(uploadPromises);
  },

  submitEdit: async function() {
    const { editForm, editingProduct } = this.data;
    const totalImages = editForm.existingImages.length + editForm.newImages.length;
    
    if (!editForm.name.trim()) {
      showError('请输入商品名称');
      return;
    }
    
    if (!editForm.spec.trim()) {
      showError('请输入商品规格');
      return;
    }
    
    if (totalImages === 0) {
      showError('请至少保留一张图片');
      return;
    }
    
    showLoading('保存中...');
    
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
      
      await productService.updateProduct(editingProduct._id, {
        name: editForm.name.trim(),
        spec: editForm.spec.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        fileIDs: allFileIDs
      });
      
      hideLoading();
      showSuccess('保存成功');
      this.hideEditModal();
      this.loadProducts();
    } catch (err) {
      hideLoading();
      console.error('保存失败：', err);
      showError(err.message || '保存失败');
    }
  },

  goToAddProduct: function() {
    wx.navigateTo({ url: '/pages/admin/admin' });
  },

  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    previewImages(url, [url]);
  }
});
