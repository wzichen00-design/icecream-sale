const callFunction = function(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data,
      success: (res) => {
        if (res.result.success === false) {
          reject(res.result);
        } else {
          resolve(res.result);
        }
      },
      fail: (err) => {
        reject({
          success: false,
          code: 'CLOUD_FUNCTION_ERROR',
          message: '云函数调用失败',
          error: err
        });
      }
    });
  });
};

const productService = {
  getProducts: function(params) {
    return callFunction('productService', {
      action: 'getProducts',
      data: params
    });
  },
  
  addProduct: function(data) {
    return callFunction('productService', {
      action: 'addProduct',
      data: data
    });
  },
  
  updateProduct: function(productId, data) {
    return callFunction('productService', {
      action: 'updateProduct',
      data: {
        productId: productId,
        ...data
      }
    });
  },
  
  deleteProduct: function(productId, fileIDs) {
    return callFunction('productService', {
      action: 'deleteProduct',
      data: {
        productId: productId,
        fileIDs: fileIDs
      }
    });
  },
  
  checkPermission: function() {
    return callFunction('productService', {
      action: 'checkPermission'
    });
  }
};

const adminService = {
  check: function() {
    return callFunction('manageAdmin', {
      action: 'check'
    });
  },
  
  init: function() {
    return callFunction('manageAdmin', {
      action: 'init'
    });
  },
  
  add: function(openid) {
    return callFunction('manageAdmin', {
      action: 'add',
      openid: openid
    });
  },
  
  remove: function(openid) {
    return callFunction('manageAdmin', {
      action: 'remove',
      openid: openid
    });
  },
  
  list: function() {
    return callFunction('manageAdmin', {
      action: 'list'
    });
  }
};

const getOpenid = function() {
  return callFunction('getOpenid', {});
};

module.exports = {
  productService,
  adminService,
  getOpenid
};
