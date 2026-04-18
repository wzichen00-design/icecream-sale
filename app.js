const { getOpenid, adminService } = require('./utils/api');
const { getCloudEnv } = require('./utils/config');

App({
  onLaunch: function() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: getCloudEnv(),
        traceUser: true
      });
    }
    
    this.globalData = {
      userInfo: null,
      openid: null,
      isAdmin: false
    };
    
    this.initUser();
  },

  initUser: async function() {
    try {
      const result = await getOpenid();
      this.globalData.openid = result.openid;
      await this.checkAdmin();
    } catch (err) {
      console.error('初始化用户信息失败：', err);
    }
  },

  checkAdmin: async function() {
    try {
      const result = await adminService.check();
      this.globalData.isAdmin = result.isAdmin;
      
      if (result.isAdmin) {
        wx.setTabBarBadge({
          index: 1,
          text: '管'
        });
      } else {
        wx.removeTabBarBadge({ index: 1 });
      }
      
      return result.isAdmin;
    } catch (err) {
      console.error('检查管理员权限失败：', err);
      this.globalData.isAdmin = false;
      return false;
    }
  },

  checkAdminPermission: async function() {
    if (this.globalData.isAdmin) {
      return true;
    }
    
    if (this.globalData.openid) {
      return await this.checkAdmin();
    }
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        if (this.globalData.openid) {
          clearInterval(checkInterval);
          const isAdmin = await this.checkAdmin();
          resolve(isAdmin);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 3000);
    });
  }
});
