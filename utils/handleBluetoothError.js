// 蓝牙错误处理工具
export function handleBluetoothError(err) {
  console.error('蓝牙错误:', err);
  
  if (err.errCode === 10001) {
    // 蓝牙未开启
    uni.showModal({
      title: '蓝牙未开启',
      content: '请开启手机蓝牙功能后重试',
      showCancel: false,
      confirmText: '我知道了'
    });
  } else if (err.errCode === 10002) {
    // 没有找到指定设备
    uni.showToast({
      title: '未找到蓝牙设备',
      icon: 'none'
    });
  } else if (err.errCode === 10003) {
    // 连接超时
    uni.showToast({
      title: '连接超时，请重试',
      icon: 'none'
    });
  } else if (err.errCode === 10004) {
    // 连接失败
    uni.showToast({
      title: '连接失败，请重试',
      icon: 'none'
    });
  } else if (err.errCode === 10005) {
    // 没有找到指定服务
    uni.showToast({
      title: '设备服务不可用',
      icon: 'none'
    });
  } else if (err.errCode === 10006) {
    // 没有找到指定特征值
    uni.showToast({
      title: '设备特征值不可用',
      icon: 'none'
    });
  } else if (err.errCode === 10007) {
    // 当前连接已断开
    uni.showToast({
      title: '连接已断开',
      icon: 'none'
    });
  } else if (err.errCode === 10008) {
    // 特征值不支持此操作
    uni.showToast({
      title: '设备不支持此操作',
      icon: 'none'
    });
  } else if (err.errCode === 10009) {
    // 系统异常
    uni.showToast({
      title: '系统异常，请重试',
      icon: 'none'
    });
  } else if (err.errCode === 10012) {
    // 连接失败
    uni.showToast({
      title: '连接失败',
      icon: 'none'
    });
  } else if (err.errCode === 10013) {
    // 配对失败
    uni.showToast({
      title: '配对失败',
      icon: 'none'
    });
  } else {
    uni.showToast({
      title: '蓝牙操作失败',
      icon: 'none'
    });
  }
}