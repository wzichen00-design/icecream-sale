const app = getApp();

Page({
  data: {
    products: [],
    loading: true,
    showDetail: false,
    currentProduct: null,
    leftList: [],
    rightList: [],
    page: 0,
    pageSize: 10,
    hasMore: true,
    loadingMore: false,
    searchKeyword: '',
    currentCategory: '',
    categories: ['全部', '雪糕', '冰淇淋', '冰棍', '其他'],
    categoryIndex: 0
  },

  searchTimer: null,

  onLoad: function () {
    this.loadProducts();
  },

  onShow: function () {
    this.loadProducts();
  },

  onUnload: function () {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },

  onPullDownRefresh: function () {
    this.setData({ page: 0, hasMore: true, products: [] });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore();
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
    return new Promise((resolve, reject) => {
      this.setData({ loading: true });
      
      const db = wx.cloud.database();
      let query = db.collection('products');
      
      if (this.data.currentCategory && this.data.currentCategory !== '全部') {
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
        .skip(0)
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
          this.distributeProducts(products);
          resolve();
        })
        .catch(err => {
          console.error('获取商品失败：', err);
          this.setData({ loading: false });
          this.showError('加载失败，请下拉重试');
          reject(err);
        });
    });
  },

  loadMore: function () {
    if (!this.data.hasMore || this.data.loadingMore) return;
    
    this.setData({ loadingMore: true });
    
    const db = wx.cloud.database();
    let query = db.collection('products');
    
    if (this.data.currentCategory && this.data.currentCategory !== '全部') {
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
        const products = [...this.data.products, ...newProducts];
        this.setData({ 
          products: products,
          loadingMore: false,
          hasMore: res.data.length >= this.data.pageSize,
          page: this.data.page + 1
        });
        this.distributeProducts(products);
      })
      .catch(err => {
        console.error('加载更多失败：', err);
        this.setData({ loadingMore: false });
      });
  },

  distributeProducts: function (products) {
    const leftList = [];
    const rightList = [];
    
    products.forEach((item, index) => {
      if (index % 2 === 0) {
        leftList.push(item);
      } else {
        rightList.push(item);
      }
    });
    
    this.setData({
      leftList: leftList,
      rightList: rightList
    });
  },

  onSearchInput: function (e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.setData({ page: 0, hasMore: true, products: [] });
      this.loadProducts();
    }, 500);
  },

  clearSearch: function () {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.setData({ searchKeyword: '', page: 0, hasMore: true, products: [] });
    this.loadProducts();
  },

  onCategoryChange: function (e) {
    const index = e.detail.value;
    this.setData({ 
      categoryIndex: index,
      currentCategory: this.data.categories[index],
      page: 0, 
      hasMore: true, 
      products: [] 
    });
    this.loadProducts();
  },

  showProductDetail: function (e) {
    const product = e.currentTarget.dataset.product;
    this.setData({
      showDetail: true,
      currentProduct: product
    });
  },

  hideDetail: function () {
    this.setData({
      showDetail: false,
      currentProduct: null
    });
  },

  previewImage: function (e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  previewDetailImage: function (e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  showError: function (message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
  }
});
