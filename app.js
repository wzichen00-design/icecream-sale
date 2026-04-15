App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-4gttptha707c6d31',
        traceUser: true,
      });
    }
    
    this.globalData = {
      userInfo: null,
      openid: null,
      isAdmin: false,
      adminList: []
    };
    
    this.getOpenid();
  },

  getOpenid: function() {
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: res => {
        this.globalData.openid = res.result.openid;
        this.checkAdmin();
      },
      fail: err => {
        console.error('获取openid失败：', err);
      }
    });
  },

  getAdminList: function() {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database();
      db.collection('config')
        .doc('admins')
        .get()
        .then(res => {
          const adminList = res.data.adminList || [];
          this.globalData.adminList = adminList;
          resolve(adminList);
        })
        .catch(err => {
          console.error('获取管理员列表失败：', err);
          resolve([]);
        });
    });
  },

  checkAdmin: async function() {
    const adminList = await this.getAdminList();
    const openid = this.globalData.openid;
    const isAdmin = adminList.includes(openid);
    this.globalData.isAdmin = isAdmin;
    
    if (isAdmin) {
      wx.setTabBarBadge({
        index: 1,
        text: '管'
      });
    } else {
      wx.removeTabBarBadge({ index: 1 });
    }
  },

  checkAdminPermission: async function() {
    if (this.globalData.isAdmin) {
      return true;
    }
    
    if (this.globalData.openid) {
      const adminList = await this.getAdminList();
      const isAdmin = adminList.includes(this.globalData.openid);
      this.globalData.isAdmin = isAdmin;
      return isAdmin;
    } else {
      return new Promise((resolve) => {
        this.getOpenid();
        setTimeout(async () => {
          const adminList = await this.getAdminList();
          const isAdmin = adminList.includes(this.globalData.openid);
          this.globalData.isAdmin = isAdmin;
          resolve(isAdmin);
        }, 1500);
      });
    }
  }
});
