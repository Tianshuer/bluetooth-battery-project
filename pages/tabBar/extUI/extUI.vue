<template>
  <view class="container">
    <view class="header">
      <text class="title">系统设置</text>
    </view>
    
    <!-- 设备设置 -->
    <view class="settings-section">
      <view class="section-title">
        <text class="title-text">设备设置</text>
      </view>
      
      <view class="setting-item" @click="showDeviceManagement">
        <view class="setting-left">
          <text class="setting-icon">📱</text>
          <text class="setting-label">设备管理</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ pairedDevicesCount }}台设备</text>
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔋</text>
          <text class="setting-label">低电量提醒</text>
        </view>
        <view class="setting-right">
          <switch :checked="lowBatteryAlert" @change="toggleLowBatteryAlert" />
        </view>
      </view>
      
      <view class="setting-item" @click="showBatteryThreshold">
        <view class="setting-left">
          <text class="setting-icon">⚡</text>
          <text class="setting-label">提醒电量阈值</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ batteryThreshold }}%</text>
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔔</text>
          <text class="setting-label">自动连接</text>
        </view>
        <view class="setting-right">
          <switch :checked="autoConnect" @change="toggleAutoConnect" />
        </view>
      </view>
    </view>
    
    <!-- 通知设置 -->
    <view class="settings-section">
      <view class="section-title">
        <text class="title-text">通知设置</text>
      </view>
      
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">🔊</text>
          <text class="setting-label">声音提醒</text>
        </view>
        <view class="setting-right">
          <switch :checked="soundAlert" @change="toggleSoundAlert" />
        </view>
      </view>
      
      <view class="setting-item">
        <view class="setting-left">
          <text class="setting-icon">📳</text>
          <text class="setting-label">震动提醒</text>
        </view>
        <view class="setting-right">
          <switch :checked="vibrationAlert" @change="toggleVibrationAlert" />
        </view>
      </view>
      
      <view class="setting-item" @click="showNotificationTime">
        <view class="setting-left">
          <text class="setting-icon">⏰</text>
          <text class="setting-label">免打扰时间</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ notificationTime }}</text>
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>
    
    <!-- 数据设置 -->
    <view class="settings-section">
      <view class="section-title">
        <text class="title-text">数据设置</text>
      </view>
      
      <view class="setting-item" @click="showDataSync">
        <view class="setting-left">
          <text class="setting-icon">☁️</text>
          <text class="setting-label">数据同步</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">{{ dataSyncStatus }}</text>
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item" @click="exportData">
        <view class="setting-left">
          <text class="setting-icon">📊</text>
          <text class="setting-label">导出数据</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item" @click="clearData">
        <view class="setting-left">
          <text class="setting-icon">🗑️</text>
          <text class="setting-label">清除数据</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>
    
    <!-- 关于应用 -->
    <view class="settings-section">
      <view class="section-title">
        <text class="title-text">关于应用</text>
      </view>
      
      <view class="setting-item" @click="showAppInfo">
        <view class="setting-left">
          <text class="setting-icon">ℹ️</text>
          <text class="setting-label">应用信息</text>
        </view>
        <view class="setting-right">
          <text class="setting-value">v{{ appVersion }}</text>
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item" @click="checkUpdate">
        <view class="setting-left">
          <text class="setting-icon">🔄</text>
          <text class="setting-label">检查更新</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item" @click="showHelp">
        <view class="setting-left">
          <text class="setting-icon">❓</text>
          <text class="setting-label">帮助与反馈</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">></text>
        </view>
      </view>
      
      <view class="setting-item" @click="showPrivacy">
        <view class="setting-left">
          <text class="setting-icon">🔒</text>
          <text class="setting-label">隐私政策</text>
        </view>
        <view class="setting-right">
          <text class="setting-arrow">></text>
        </view>
      </view>
    </view>
    
    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">蓝牙电池监控 v{{ appVersion }}</text>
      <text class="copyright-text">© 2024 All Rights Reserved</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      pairedDevicesCount: 3,
      lowBatteryAlert: true,
      batteryThreshold: 20,
      autoConnect: true,
      soundAlert: true,
      vibrationAlert: false,
      notificationTime: '22:00-08:00',
      dataSyncStatus: '已开启',
      appVersion: '1.0.0'
    }
  },
  methods: {
    // 设备管理
    showDeviceManagement() {
      uni.showModal({
        title: '设备管理',
        content: '管理已配对的蓝牙设备，可以查看设备详情、删除设备或修改设备名称。',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    // 切换低电量提醒
    toggleLowBatteryAlert(e) {
      this.lowBatteryAlert = e.detail.value;
      uni.showToast({
        title: this.lowBatteryAlert ? '已开启低电量提醒' : '已关闭低电量提醒',
        icon: 'success'
      });
    },
    
    // 设置电量阈值
    showBatteryThreshold() {
      const items = ['10%', '15%', '20%', '25%', '30%'];
      uni.showActionSheet({
        itemList: items,
        success: (res) => {
          this.batteryThreshold = parseInt(items[res.tapIndex]);
          uni.showToast({
            title: `电量阈值已设为${this.batteryThreshold}%`,
            icon: 'success'
          });
        }
      });
    },
    
    // 切换自动连接
    toggleAutoConnect(e) {
      this.autoConnect = e.detail.value;
      uni.showToast({
        title: this.autoConnect ? '已开启自动连接' : '已关闭自动连接',
        icon: 'success'
      });
    },
    
    // 切换声音提醒
    toggleSoundAlert(e) {
      this.soundAlert = e.detail.value;
      uni.showToast({
        title: this.soundAlert ? '已开启声音提醒' : '已关闭声音提醒',
        icon: 'success'
      });
    },
    
    // 切换震动提醒
    toggleVibrationAlert(e) {
      this.vibrationAlert = e.detail.value;
      uni.showToast({
        title: this.vibrationAlert ? '已开启震动提醒' : '已关闭震动提醒',
        icon: 'success'
      });
    },
    
    // 设置免打扰时间
    showNotificationTime() {
      uni.showModal({
        title: '免打扰时间',
        content: '当前设置：' + this.notificationTime + '\n\n在此时间段内将不会收到通知提醒。',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    // 数据同步
    showDataSync() {
      uni.showModal({
        title: '数据同步',
        content: '当前状态：' + this.dataSyncStatus + '\n\n数据将自动同步到云端，确保数据安全。',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    // 导出数据
    exportData() {
      uni.showLoading({ title: '导出中...' });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '数据导出成功',
          icon: 'success'
        });
      }, 2000);
    },
    
    // 清除数据
    clearData() {
      uni.showModal({
        title: '确认清除',
        content: '此操作将清除所有本地数据，包括设备记录和历史数据，是否继续？',
        confirmText: '确认清除',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '清除中...' });
            setTimeout(() => {
              uni.hideLoading();
              uni.showToast({
                title: '数据已清除',
                icon: 'success'
              });
            }, 1500);
          }
        }
      });
    },
    
    // 应用信息
    showAppInfo() {
      uni.showModal({
        title: '应用信息',
        content: `蓝牙电池监控 v${this.appVersion}\n\n一款专业的蓝牙设备电池监控应用，支持实时监控多种蓝牙设备的电池状态。`,
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    // 检查更新
    checkUpdate() {
      uni.showLoading({ title: '检查中...' });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '当前已是最新版本',
          icon: 'success'
        });
      }, 2000);
    },
    
    // 帮助与反馈
    showHelp() {
      uni.showModal({
        title: '帮助与反馈',
        content: '如有使用问题或建议，欢迎通过以下方式联系我们：\n\n• 应用内反馈\n• 邮件：support@example.com\n• QQ群：123456789',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    // 隐私政策
    showPrivacy() {
      uni.showModal({
        title: '隐私政策',
        content: '我们重视您的隐私保护，所有数据仅用于设备监控功能，不会收集或分享您的个人信息。',
        showCancel: false,
        confirmText: '我知道了'
      });
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  padding: 40rpx 30rpx 20rpx;
  background: linear-gradient(135deg, #007aff, #5ac8fa);
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.settings-section {
  margin: 30rpx 20rpx 0;
  background-color: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

.section-title {
  padding: 30rpx 30rpx 0;
  margin-bottom: 10rpx;
}

.title-text {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.setting-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
}

.setting-label {
  font-size: 30rpx;
  color: #333333;
}

.setting-right {
  display: flex;
  align-items: center;
}

.setting-value {
  font-size: 26rpx;
  color: #666666;
  margin-right: 10rpx;
}

.setting-arrow {
  font-size: 24rpx;
  color: #cccccc;
}

.version-info {
  text-align: center;
  padding: 60rpx 40rpx;
}

.version-text {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.copyright-text {
  font-size: 24rpx;
  color: #999999;
}
</style> 