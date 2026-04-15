const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { action, openid } = event;
  
  try {
    let adminConfig = await db.collection('config').doc('admins').get();
    let adminList = adminConfig.data.adminList || [];
    
    if (action === 'add') {
      if (!adminList.includes(openid)) {
        adminList.push(openid);
        await db.collection('config').doc('admins').update({
          data: {
            adminList: adminList,
            updateTime: db.serverDate()
          }
        });
      }
      return { success: true, adminList };
    }
    
    if (action === 'remove') {
      adminList = adminList.filter(id => id !== openid);
      await db.collection('config').doc('admins').update({
        data: {
          adminList: adminList,
          updateTime: db.serverDate()
        }
      });
      return { success: true, adminList };
    }
    
    if (action === 'list') {
      return { success: true, adminList };
    }
    
    if (action === 'init') {
      const wxContext = cloud.getWXContext();
      const currentOpenid = wxContext.OPENID;
      
      try {
        await db.collection('config').doc('admins').get();
        return { success: true, message: '配置已存在', adminList };
      } catch (err) {
        await db.collection('config').add({
          data: {
            _id: 'admins',
            adminList: [currentOpenid],
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
        return { success: true, message: '初始化成功', adminList: [currentOpenid] };
      }
    }
    
    return { success: false, message: '未知操作' };
    
  } catch (err) {
    if (action === 'init') {
      const wxContext = cloud.getWXContext();
      const currentOpenid = wxContext.OPENID;
      
      await db.collection('config').add({
        data: {
          _id: 'admins',
          adminList: [currentOpenid],
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      return { success: true, message: '初始化成功', adminList: [currentOpenid] };
    }
    
    return { success: false, message: err.message };
  }
};
