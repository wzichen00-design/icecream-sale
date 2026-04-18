const app = getApp();
const { productService } = require('../../utils/api');
const { formatTime, debounce, showError, CATEGORIES, PAGE_SIZE } = require('../../utils/util');

Page({
  data: {
    products: [],
    loading: true,
    showDetail: false,
    currentProduct: null,
    leftList: [],
    rightList: [],
    hasMore: true,
    loadingMore: false,
    searchKeyword: '',
    currentCategory: '',
    categories: CATEGORIES,
    categoryIndex: 0,
    lastId: null,
    lastCreateTime: null
  },

  onLoad: function() {
    this.loadProducts();
  },

  onShow: function() {
    this.loadProducts();
  },

  onPullDownRefresh: function() {
    this.setData({ 
      lastId: null, 
      lastCreateTime: null,
      hasMore: true, 
      products: [] 
    });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMore();
    }
  },

  loadProducts: function() {
    return new Promise((resolve, reject) => {
      this.setData({ loading: true });
      
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
          
          this.distributeProducts(products);
          resolve();
        })
        .catch(err => {
          console.error('获取商品失败：', err);
          this.setData({ loading: false });
          showError('加载失败，请下拉重试');
          reject(err);
        });
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
        
        const products = [...this.data.products, ...newProducts];
        
        this.setData({ 
          products: products,
          loadingMore: false,
          hasMore: res.hasMore,
          lastId: res.lastId,
          lastCreateTime: res.lastCreateTime
        });
        
        this.distributeProducts(products);
      })
      .catch(err => {
        console.error('加载更多失败：', err);
        this.setData({ loadingMore: false });
        showError('加载失败');
      });
  },

  distributeProducts: function(products) {
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

  onSearchInput: function(e) {
    const value = e.detail.value;
    this.setData({ searchKeyword: value });
    
    this.debouncedSearch(value);
  },

  debouncedSearch: debounce(function(keyword) {
    this.setData({ 
      lastId: null, 
      lastCreateTime: null,
      hasMore: true, 
      products: [] 
    });
    this.loadProducts();
  }, 500),

  clearSearch: function() {
    this.setData({ 
      searchKeyword: '', 
      lastId: null, 
      lastCreateTime: null,
      hasMore: true, 
      products: [] 
    });
    this.loadProducts();
  },

  onCategoryChange: function(e) {
    const index = e.detail.value;
    this.setData({ 
      categoryIndex: index,
      currentCategory: this.data.categories[index],
      lastId: null, 
      lastCreateTime: null,
      hasMore: true, 
      products: [] 
    });
    this.loadProducts();
  },

  showProductDetail: function(e) {
    const product = e.currentTarget.dataset.product;
    this.setData({
      showDetail: true,
      currentProduct: product
    });
  },

  hideDetail: function() {
    this.setData({
      showDetail: false,
      currentProduct: null
    });
  },

  previewImage: function(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  previewDetailImage: function(e) {
    const url = e.currentTarget.dataset.url;
    const urls = e.currentTarget.dataset.urls;
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  goToSettings: function() {
    wx.navigateTo({
      url: '/pages/adminSettings/adminSettings'
    });
  }
});
