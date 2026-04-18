const ENV = {
  dev: {
    cloudEnv: 'icecream-show-2026-0dzky2970a467'
  },
  prod: {
    cloudEnv: 'icecream-show-2026-0dzky2970a467'
  }
};

const currentEnv = 'prod';

const config = {
  env: currentEnv,
  cloudEnv: ENV[currentEnv].cloudEnv,
  
  pageSize: 10,
  maxImages: 9,
  imageQuality: 80,
  
  cache: {
    productsExpireTime: 5 * 60 * 1000
  },
  
  categories: ['全部', '雪糕', '冰淇淋', '冰棍', '其他']
};

const getCloudEnv = function() {
  return config.cloudEnv;
};

const getConfig = function(key) {
  return config[key];
};

module.exports = {
  config,
  getCloudEnv,
  getConfig
};
