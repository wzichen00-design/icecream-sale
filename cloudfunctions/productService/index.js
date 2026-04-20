const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

const ADMIN_CONFIG_ID = 'admins'

async function checkAdmin (openid) {
  try {
    const res = await db.collection('config').doc(ADMIN_CONFIG_ID).get()
    const adminList = res.data.adminList || []
    return adminList.includes(openid)
  } catch (err) {
    console.error('检查管理员权限失败:', err)
    return false
  }
}

async function getProducts (params) {
  const { category, keyword, lastId, lastCreateTime, pageSize = 10 } = params

  let query = db.collection('products')

  if (category && category !== '全部') {
    query = query.where({ category })
  }

  if (keyword) {
    query = query.where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    })
  }

  if (lastId && lastCreateTime) {
    query = query.where(_.or([
      {
        createTime: _.lt(lastCreateTime)
      },
      {
        createTime: _.eq(lastCreateTime),
        _id: _.gt(lastId)
      }
    ]))
  }

  const result = await query
    .orderBy('createTime', 'desc')
    .orderBy('_id', 'asc')
    .limit(pageSize + 1)
    .get()

  const hasMore = result.data.length > pageSize
  const products = hasMore ? result.data.slice(0, pageSize) : result.data

  return {
    products,
    hasMore,
    lastId: products.length > 0 ? products[products.length - 1]._id : null,
    lastCreateTime: products.length > 0 ? products[products.length - 1].createTime : null
  }
}

async function addProduct (openid, data) {
  const isAdmin = await checkAdmin(openid)
  if (!isAdmin) {
    return { success: false, code: 'PERMISSION_DENIED', message: '无权限执行此操作' }
  }

  const { name, spec, description, category, fileID, fileIDs } = data

  if (!name || !name.trim()) {
    return { success: false, code: 'INVALID_PARAM', message: '雪糕名称不能为空' }
  }

  if (!spec || !spec.trim()) {
    return { success: false, code: 'INVALID_PARAM', message: '雪糕规格不能为空' }
  }

  if (!fileIDs || fileIDs.length === 0) {
    return { success: false, code: 'INVALID_PARAM', message: '请至少上传一张图片' }
  }

  const result = await db.collection('products').add({
    data: {
      name: name.trim(),
      spec: spec.trim(),
      description: (description || '').trim(),
      category: category || '',
      fileID: fileIDs[0],
      fileIDs,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      createdBy: openid,
      isDeleted: false
    }
  })

  return { success: true, data: { _id: result._id } }
}

async function updateProduct (openid, productId, data) {
  const isAdmin = await checkAdmin(openid)
  if (!isAdmin) {
    return { success: false, code: 'PERMISSION_DENIED', message: '无权限执行此操作' }
  }

  const { name, spec, description, category, fileID, fileIDs } = data

  if (!name || !name.trim()) {
    return { success: false, code: 'INVALID_PARAM', message: '雪糕名称不能为空' }
  }

  if (!spec || !spec.trim()) {
    return { success: false, code: 'INVALID_PARAM', message: '雪糕规格不能为空' }
  }

  if (!fileIDs || fileIDs.length === 0) {
    return { success: false, code: 'INVALID_PARAM', message: '请至少保留一张图片' }
  }

  await db.collection('products').doc(productId).update({
    data: {
      name: name.trim(),
      spec: spec.trim(),
      description: (description || '').trim(),
      category: category || '',
      fileID: fileIDs[0],
      fileIDs,
      updateTime: db.serverDate(),
      updatedBy: openid
    }
  })

  return { success: true }
}

async function deleteProduct (openid, productId, fileIDs) {
  const isAdmin = await checkAdmin(openid)
  if (!isAdmin) {
    return { success: false, code: 'PERMISSION_DENIED', message: '无权限执行此操作' }
  }

  await db.collection('products').doc(productId).update({
    data: {
      isDeleted: true,
      deletedAt: db.serverDate(),
      deletedBy: openid
    }
  })

  if (fileIDs && fileIDs.length > 0) {
    try {
      await cloud.deleteFile({ fileList: fileIDs })
    } catch (err) {
      console.error('删除云存储文件失败:', err)
    }
  }

  return { success: true }
}

async function checkPermission (openid) {
  const isAdmin = await checkAdmin(openid)
  return {
    success: true,
    data: {
      isAdmin,
      openid
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, data } = event

  try {
    let result

    switch (action) {
      case 'getProducts':
        result = await getProducts(data || {})
        break

      case 'addProduct':
        result = await addProduct(openid, data)
        break

      case 'updateProduct':
        result = await updateProduct(openid, data.productId, data)
        break

      case 'deleteProduct':
        result = await deleteProduct(openid, data.productId, data.fileIDs)
        break

      case 'checkPermission':
        result = await checkPermission(openid)
        break

      default:
        result = { success: false, code: 'UNKNOWN_ACTION', message: '未知操作' }
    }

    return result
  } catch (err) {
    console.error('云函数执行错误:', err)
    return {
      success: false,
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      error: err.message
    }
  }
}
