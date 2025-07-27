<template>
  <view class="container">
    <view class="header">
      <text class="title">蓝牙设备状态</text>
      <view class="refresh-btn" @click="refreshDevices">
        <text class="refresh-text">刷新</text>
      </view>
    </view>
    
    <!-- 连接状态总览 -->
    <view class="status-overview">
      <view class="status-card card">
        <text class="status-label">已连接设备</text>
        <text class="status-value">{{ connectedDevicesCount }}</text>
      </view>
      <view class="status-card card">
        <text class="status-label">设备总数</text>
        <text class="status-value">{{ totalDevicesCount }}</text>
      </view>
    </view>
    
    <!-- 设备列表 -->
    <view class="device-list">
      <view v-if="devices.length === 0" class="empty-state card">
        <image class="empty-icon" src="/static/logo.png" mode="aspectFit" />
        <text class="empty-text">暂无设备连接</text>
        <text class="tip-text">请前往设备控制页面扫描并连接蓝牙设备</text>
        <navigator url="/pages/tabBar/API/API" open-type="switchTab">
          <button class="scan-btn">去连接设备</button>
        </navigator>
      </view>
      
      <view v-for="device in devices" :key="device.id" class="device-card card">
        <view class="device-header">
          <view class="device-info">
            <text class="device-name">{{ device.name }}</text>
            <text class="device-id">{{ device.id }}</text>
          </view>
          <view class="connection-status" :class="device.connected ? 'connected' : 'disconnected'">
            <view class="status-dot"></view>
            <text class="status-text">{{ device.connected ? '已连接' : '未连接' }}</text>
          </view>
        </view>
        
        <view v-if="device.connected" class="battery-section">
          <view class="battery-info">
            <text class="battery-label">电池电量</text>
            <view class="battery-display">
              <view class="battery-icon">
                <view class="battery-body" :style="{ backgroundColor: getBatteryColor(device.batteryLevel) }">
                  <view class="battery-level" :style="{ width: device.batteryLevel + '%' }"></view>
                </view>
                <view class="battery-tip"></view>
              </view>
              <text class="battery-percentage">{{ device.batteryLevel }}%</text>
            </view>
          </view>
          
          <view class="device-details">
            <view class="detail-item">
              <text class="detail-label">连接时间</text>
              <text class="detail-value">{{ formatTime(device.connectedTime) }}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">信号强度</text>
              <text class="detail-value">{{ device.signalStrength }}dBm</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">设备类型</text>
              <text class="detail-value">{{ device.deviceType }}</text>
            </view>
          </view>
          
          <view class="battery-history">
            <text class="history-title">电量变化趋势</text>
            <view class="history-chart">
              <view v-for="(point, index) in device.batteryHistory" :key="index" 
                    class="chart-point" 
                    :style="{ height: point + '%', backgroundColor: getBatteryColor(point) }">
              </view>
            </view>
          </view>
        </view>
        
        <view v-else class="disconnected-info">
          <text class="disconnect-time">上次连接：{{ formatTime(device.lastConnected) }}</text>
          <button class="reconnect-btn" @click="reconnectDevice(device)">重新连接</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      devices: [
        {
          id: 'BT001',
          name: '蓝牙耳机 Pro',
          connected: true,
          batteryLevel: 85,
          connectedTime: Date.now() - 3600000,
          signalStrength: -45,
          deviceType: '音频设备',
          batteryHistory: [90, 88, 86, 85, 85, 84, 85],
          lastConnected: Date.now() - 3600000
        },
        {
          id: 'BT002', 
          name: '智能手环',
          connected: true,
          batteryLevel: 60,
          connectedTime: Date.now() - 7200000,
          signalStrength: -38,
          deviceType: '可穿戴设备',
          batteryHistory: [75, 70, 68, 65, 62, 60, 60],
          lastConnected: Date.now() - 7200000
        },
        {
          id: 'BT003',
          name: '蓝牙音箱',
          connected: false,
          batteryLevel: 20,
          connectedTime: null,
          signalStrength: -60,
          deviceType: '音频设备',
          batteryHistory: [25, 22, 20],
          lastConnected: Date.now() - 86400000
        }
      ],
      refreshing: false
    }
  },
  computed: {
    connectedDevicesCount() {
      return this.devices.filter(device => device.connected).length;
    },
    totalDevicesCount() {
      return this.devices.length;
    }
  },
  onLoad() {
    this.loadDevicesFromGlobal();
    this.startRealTimeMonitoring();
  },
  onShow() {
    this.loadDevicesFromGlobal();
    this.refreshDevices();
  },
  onUnload() {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
  },
  onPullDownRefresh() {
    this.refreshDevices().then(() => {
      wx.stopPullDownRefresh();
    });
  },
  methods: {
    // 从全局数据加载设备信息
    loadDevicesFromGlobal() {
      const app = getApp();
      if (app.globalData.currentDevice) {
        // 更新当前连接的设备信息
        const currentDevice = app.globalData.currentDevice;
        const existingIndex = this.devices.findIndex(d => d.id === currentDevice.deviceId);
        
        if (existingIndex >= 0) {
          this.devices[existingIndex] = {
            ...this.devices[existingIndex],
            ...currentDevice,
            connected: true
          };
        } else {
          // 添加新设备
          this.devices.unshift({
            id: currentDevice.deviceId,
            name: currentDevice.name || '新设备',
            connected: true,
            batteryLevel: currentDevice.batteryLevel || 0,
            connectedTime: Date.now(),
            signalStrength: currentDevice.RSSI || -50,
            deviceType: '蓝牙设备',
            batteryHistory: [currentDevice.batteryLevel || 0],
            lastConnected: Date.now()
          });
        }
      }
    },
    
    // 刷新设备状态
    refreshDevices() {
      return new Promise((resolve) => {
        if (this.refreshing) {
          resolve();
          return;
        }
        
        this.refreshing = true;
        wx.showNavigationBarLoading();
        
        setTimeout(() => {
          // 模拟更新设备状态
          this.devices.forEach(device => {
            if (device.connected) {
              // 随机变化电量（模拟实际使用）
              const change = Math.random() * 2 - 1; // -1 到 1 的随机数
              device.batteryLevel = Math.max(0, Math.min(100, device.batteryLevel + change));
              device.batteryLevel = Math.round(device.batteryLevel);
              
              // 更新历史记录
              device.batteryHistory.push(device.batteryLevel);
              if (device.batteryHistory.length > 7) {
                device.batteryHistory.shift();
              }
              
              // 检查低电量提醒
              if (device.batteryLevel <= 20) {
                this.showLowBatteryAlert(device);
              }
            }
          });
          
          wx.hideNavigationBarLoading();
          this.refreshing = false;
          
          wx.showToast({
            title: '刷新完成',
            icon: 'success',
            duration: 1000
          });
          
          resolve();
        }, 1500);
      });
    },
    
    // 低电量提醒
    showLowBatteryAlert(device) {
      // 检查是否已经提醒过
      const lastAlertKey = `lowBattery_${device.id}`;
      const lastAlert = wx.getStorageSync(lastAlertKey);
      const now = Date.now();
      
      // 如果距离上次提醒超过1小时，再次提醒
      if (!lastAlert || (now - lastAlert) > 3600000) {
        wx.showModal({
          title: '低电量提醒',
          content: `设备"${device.name}"电量仅剩${device.batteryLevel}%，请及时充电。`,
          showCancel: false,
          confirmText: '我知道了'
        });
        
        // 记录提醒时间
        wx.setStorageSync(lastAlertKey, now);
      }
    },
    
    // 重新连接设备
    reconnectDevice(device) {
      wx.showLoading({ title: '连接中...' });
      
      setTimeout(() => {
        device.connected = true;
        device.connectedTime = Date.now();
        wx.hideLoading();
        wx.showToast({
          title: '连接成功',
          icon: 'success'
        });
      }, 2000);
    },
    
    // 获取电池颜色
    getBatteryColor(level) {
      if (level > 60) return '#52c41a';
      if (level > 20) return '#faad14';
      return '#ff4d4f';
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '--';
      
      const now = Date.now();
      const diff = now - timestamp;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}天前`;
      }
      if (hours > 0) {
        return `${hours}小时${minutes}分钟前`;
      }
      return `${minutes}分钟前`;
    },
    
    // 开始实时监控
    startRealTimeMonitoring() {
      this.monitorTimer = setInterval(() => {
        this.devices.forEach(device => {
          if (device.connected) {
            // 模拟电量缓慢下降
            if (Math.random() < 0.1) { // 10%概率更新
              device.batteryLevel = Math.max(0, device.batteryLevel - 0.1);
              device.batteryLevel = Math.round(device.batteryLevel * 10) / 10;
            }
          }
        });
      }, 30000); // 每30秒更新一次
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 30rpx 20rpx;
  background: linear-gradient(135deg, #007aff, #5ac8fa);
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.refresh-btn {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 15rpx 25rpx;
  border-radius: 20rpx;
}

.refresh-text {
  color: #ffffff;
  font-size: 28rpx;
}

.status-overview {
  display: flex;
  margin: 30rpx 20rpx;
  gap: 20rpx;
}

.status-card {
  flex: 1;
  text-align: center;
}

.status-label {
  display: block;
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.status-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #007aff;
}

.device-list {
  padding: 0 20rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 40rpx;
  margin-bottom: 20rpx;
}

.empty-icon {
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #999999;
  margin-bottom: 10rpx;
  display: block;
}

.tip-text {
  font-size: 26rpx;
  color: #cccccc;
  margin-bottom: 40rpx;
  display: block;
}

.scan-btn {
  background-color: #007aff;
  color: #ffffff;
  border-radius: 25rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  border: none;
}

.device-card {
  /* 使用通用card样式 */
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25rpx;
}

.device-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  display: block;
  margin-bottom: 8rpx;
}

.device-id {
  font-size: 24rpx;
  color: #999999;
}

.connection-status {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

.connected .status-dot {
  background-color: #52c41a;
}

.disconnected .status-dot {
  background-color: #ff4d4f;
}

.status-text {
  font-size: 24rpx;
  color: #666666;
}

.battery-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 25rpx;
}

.battery-info {
  margin-bottom: 30rpx;
}

.battery-label {
  font-size: 28rpx;
  color: #333333;
  margin-bottom: 15rpx;
  display: block;
}

.battery-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.battery-icon {
  display: flex;
  align-items: center;
}

.battery-body {
  width: 80rpx;
  height: 40rpx;
  border: 2rpx solid #ddd;
  border-radius: 4rpx;
  position: relative;
  overflow: hidden;
}

.battery-level {
  height: 100%;
  background-color: inherit;
  transition: width 0.3s ease;
}

.battery-tip {
  width: 6rpx;
  height: 20rpx;
  background-color: #ddd;
  border-radius: 0 2rpx 2rpx 0;
  margin-left: 2rpx;
}

.battery-percentage {
  font-size: 36rpx;
  font-weight: bold;
  color: #007aff;
}

.device-details {
  margin-bottom: 30rpx;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.detail-label {
  font-size: 26rpx;
  color: #666666;
}

.detail-value {
  font-size: 26rpx;
  color: #333333;
}

.battery-history {
  margin-top: 25rpx;
  padding-top: 25rpx;
  border-top: 1px solid #f0f0f0;
}

.history-title {
  font-size: 26rpx;
  color: #666666;
  margin-bottom: 15rpx;
  display: block;
}

.history-chart {
  display: flex;
  align-items: flex-end;
  height: 80rpx;
  gap: 8rpx;
}

.chart-point {
  flex: 1;
  min-height: 10rpx;
  border-radius: 2rpx 2rpx 0 0;
  transition: height 0.3s ease;
}

.disconnected-info {
  border-top: 1px solid #f0f0f0;
  padding-top: 25rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.disconnect-time {
  font-size: 26rpx;
  color: #999999;
}

.reconnect-btn {
  background-color: #52c41a;
  color: #ffffff;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 20rpx;
  border: none;
}
</style> 