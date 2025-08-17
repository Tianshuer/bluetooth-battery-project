/**
 * 网络管理器 - uniapp版本
 * 精简版本，移除不必要的依赖和base64加密
 */
class NetworkMgr {
  constructor() {
    this.timeoutInterval = 20000; // 20秒超时
    this.cachedUserAgent = null;
  }

  /**
   * 获取单例实例
   * @returns {NetworkMgr} 网络管理器实例
   */
  static getInstance() {
    if (!NetworkMgr.instance) {
      NetworkMgr.instance = new NetworkMgr();
    }
    return NetworkMgr.instance;
  }

  /**
   * 初始化网络管理器
   */
  static setup() {
    const networkManager = NetworkMgr.getInstance();
    
    // 延迟5秒后上传应用信息
    setTimeout(() => {
      networkManager.uploadAppInfoToDataInterface((response, error) => {
        if (error) {
          console.error('上传应用信息失败:', error);
        } else {
          // 检查服务器返回的code
          if (response && response.code === 201) {
            // 应用验证失败，跳转到空白页面
            console.log('应用验证失败，跳转到空白页面');
            uni.navigateTo({
              url: '/pages/blank/blank',
              success: () => {
                console.log('跳转成功');
              },
              fail: (err) => {
                console.error('跳转失败:', err);
              }
            });
          }
        }
      });
    }, 5000);
  }

  /**
   * 获取应用信息
   * @returns {Object} 应用信息对象
   */
  getAppInfo() {
    const systemInfo = uni.getAppBaseInfo();
    return {
      appName: systemInfo.appName || 'Unknown',
      bundleId: systemInfo.appId || 'Unknown',
      bundlePath: systemInfo.platform || 'Unknown'
    };
  }

  /**
   * 获取设备信息
   * @returns {Object} 设备信息对象
   */
  getDeviceInfo() {
    const systemInfo = uni.getDeviceInfo();
    
    return {
      deviceName: systemInfo.deviceBrand || 'Unknown',
      deviceModel: systemInfo.model || 'Unknown',
      systemName: systemInfo.platform || 'Unknown',
      systemVersion: systemInfo.system || 'Unknown',
      deviceOrientation: systemInfo.screenOrientation || 'portrait',
      isMultitaskingSupported: true, // uniapp默认支持
      userInterfaceIdiom: systemInfo.platform === 'ios' ? 'phone' : 'android'
    };
  }



  /**
   * 获取用户代理字符串
   * @param {Function} completion 回调函数
   */
  getUserAgent(completion) {
    if (this.cachedUserAgent) {
      completion(this.cachedUserAgent);
      return;
    }

    const systemInfo = uni.getDeviceInfo();
    this.cachedUserAgent = `Mozilla/5.0 (${systemInfo.platform}; CPU ${systemInfo.platform} OS ${systemInfo.system} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${systemInfo.system} Mobile/15E148 Safari/604.1`;
    
    completion(this.cachedUserAgent);
  }

  /**
   * 发送POST请求
   * @param {string} urlString 请求URL
   * @param {Object} parameters 请求参数
   * @param {Function} completion 完成回调
   */
  postRequest(urlString, parameters, completion) {
    if (!urlString || urlString.length === 0) {
      completion(null, { message: 'URL不能为空' });
      return;
    }

    uni.request({
      url: urlString,
      method: 'POST',
      data: parameters,
      header: {
        'Content-Type': 'application/json'
      },
      timeout: this.timeoutInterval,
      success: (res) => {
        // 检查HTTP状态码
        if (res.statusCode < 200 || res.statusCode >= 300) {
          completion(null, { 
            message: `HTTP错误: ${res.statusCode}`,
            statusCode: res.statusCode 
          });
          return;
        }

        // 检查响应数据
        if (!res.data) {
          completion(null, { message: '响应数据为空' });
          return;
        }

        completion(res.data, null);
      },
      fail: (err) => {
        completion(null, { 
          message: err.errMsg || '请求失败',
          error: err 
        });
      }
    });
  }

  /**
   * 上传应用信息到数据接口
   * @param {Function} completion 完成回调
   */
  uploadAppInfoToDataInterface(completion) {
    const appInfo = this.getAppInfo();
    const deviceInfoDict = this.getDeviceInfo();

    this.getUserAgent((userAgent) => {
      const parameters = {
        appName: appInfo.appName || 'Unknown',
        bundleId: appInfo.bundleId || 'Unknown',
        ipAddress: 'unknown',
        userAgent: userAgent || 'Unknown',
        deviceInfo: deviceInfoDict || {}
      };

      const urlString = 'https://apiv1.softlipa.xin/appAuthor';

      this.postRequest(urlString, parameters, completion);
    });
  }


}

// 导出单例
export default NetworkMgr.getInstance();

// 自动初始化
NetworkMgr.setup();
