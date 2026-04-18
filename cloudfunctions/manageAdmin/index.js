const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const ADMIN_CONFIG_ID = 'admins';

async function checkAdmin(openid) {
  try {
    const res = await db.collection('config').doc(ADMIN_CONFIG_ID).get();
    const adminList = res.data.adminList || [];
    return adminList.includes(openid);
  } catch (err) {
    return false;
  }
}

async function getAdminList() {
  try {
    const res = await db.collection('config').doc(ADMIN_CONFIG_ID).get();
    return res.data.adminList || [];
  } catch (err) {
    return [];
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const currentOpenid = wxContext.OPENID;
  const { action, openid } = event;
  
  try {
    const isAdmin = await checkAdmin(currentOpenid);
    
    if (action === 'init') {
      try {
        await db.collection('config').doc(ADMIN_CONFIG_ID).get();
        const adminList = await getAdminList();
        return { success: true, message: '配置已存在', adminList };
      } catch (err) {
        await db.collection('config').add({
          data: {
            _id: ADMIN_CONFIG_ID,
            adminList: [currentOpenid],
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
        return { success: true, message: '初始化成功', adminList: [currentOpenid] };
      }
    }
    
    if (!isAdmin) {
      return { 
        success: false, 
        code: 'PERMISSION_DENIED', 
        message: '无权限执行此操作，您不是管理员' 
      };
    }
    
    if (action === 'add') {
      if (!openid) {
        return { success: false, code: 'INVALID_PARAM', message: 'openid 不能为空' };
      }
      
      const adminList = await getAdminList();
      if (!adminList.includes(openid)) {
        adminList.push(openid);
        await db.collection('config').doc(ADMIN_CONFIG_ID).update({
          data: {
            adminList: adminList,
            updateTime: db.serverDate()
          }
        });
      }
      return { success: true, adminList };
    }
    
    if (action === 'remove') {
      if (!openid) {
        return { success: false, code: 'INVALID_PARAM', message: 'openid 不能为空' };
      }
      
      const adminList = await getAdminList();
      const newAdminList = adminList.filter(id => id !== openid);
      
      if (newAdminList.length === 0) {
        return { success: false, code: 'INVALID_OPERATION', message: '至少保留一位管理员' };
      }
      
      await db.collection('config').doc(ADMIN_CONFIG_ID).update({
        data: {
          adminList: newAdminList,
          updateTime: db.serverDate()
        }
      });
      return { success: true, adminList: newAdminList };
    }
    
    if (action === 'list') {
      const adminList = await getAdminList();
      return { success: true, adminList };
    }
    
    if (action === 'check') {
      return { 
        success: true, 
        isAdmin,
        openid: currentOpenid 
      };
    }
    
    return { success: false, code: 'UNKNOWN_ACTION', message: '未知操作' };
    
  } catch (err) {
    console.error('manageAdmin 云函数执行错误:', err);
    return { 
      success: false, 
      code: 'INTERNAL_ERROR', 
      message: '服务器内部错误',
      error: err.message 
    };
  }
};
