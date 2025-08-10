<template>
  <view class="battery-card">
    <view class="card-header">
      <image class="logo" src="/static/images/BLEIcon.png" mode="aspectFit" @click="handleLogoClick"></image>
      <view class="device-info">
        <text class="device-name">{{ deviceName || batteryDevice.name || t('device_name_unknown') }}</text>
        <text class="device-status">{{ versionName || t('version_unknown') }}</text>
      </view>
      <view class="connection-status">
        <text class="status-text">
          {{ isConnected ? t('connection_success') : t('connection_closed') }}
        </text>
      </view>
    </view>
    
    <view class="battery-info">
      <view class="battery-icon-wrapper">
        <image class="battery-icon" src="/static/images/battery-icon.png" mode="aspectFit"></image>
      </view>
      <view class="battery-content">
        <view class="battery-header">
          <text class="battery-percentage">{{ batteryPercentage }}%</text>
          <view class="language-selector" @click="openLanguagePicker">
            <image class="country-flag" :src="languageOptions[currentLanguageIndex].iconUrl" mode="aspectFit"></image>
            <view class="language-text">{{ t('language') }}</view>
          </view>
        </view>
        <view class="status-indicators">
          <view class="status-item">
            <view class="status-dot red"></view>
            <text class="status-text">{{ t('discharge_mos') }}</text>
          </view>
          <view class="status-item">
            <view class="status-dot red"></view>
            <text class="status-text">{{ t('charge_mos') }}</text>
          </view>
          <view class="status-item">
            <view class="status-dot red"></view>
            <text class="status-text">{{ t('balancing') }}</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 蓝牙设备列表组件 -->
    <BluetoothList ref="bluetoothList" />
    
    <!-- 连接失败提示盒子 -->
    <view v-if="!isConnected" class="connection-failed-tip" @click="handleLogoClick">
      <text class="tip-text">{{ t('ble_disconnected_retry') }}</text>
    </view>
    
    <!-- 语言选择弹出框 -->
    <uni-popup 
      ref="languagePopup" 
      type="bottom" 
      :is-mask-click="false"
      :safe-area="false"
      >
      <view class="language-popup">
        <view class="popup-header">
          <text class="popup-title">{{ t('language') }}</text>
          <view class="close-btn" @click="closeLanguagePicker">
            <text class="close-text">✕</text>
          </view>
        </view>
        <view class="language-list">
          <view 
            v-for="(language, index) in languageOptions" 
            :key="index"
            class="language-item"
            :class="{ active: currentLanguageIndex === index }"
            @click="selectLanguage(index)"
          >
            <image class="language-icon" :src="language.iconUrl" mode="aspectFit"></image>
            <text class="language-name">{{ language.shortText }}</text>
            <text v-if="currentLanguageIndex === index" class="selected-mark">✓</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import uniPopup from '@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue'
import { mapGetters, mapActions } from 'vuex'
import BluetoothList from './BluetoothList.vue'

export default {
  name: 'BatteryCard',
  components: {
    uniPopup,
    BluetoothList
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters([
      'currentLanguage',
      'languageOptions', 
      'currentLanguageIndex',
      'isConnected',
      't',
      'batteryPercentage',
      'batteryDevice',
      'versionName',
      'deviceName'
    ])
  },
  methods: {
    ...mapActions([
      'switchLanguage',
      'setConnectionStatus',
      'updateConnectionStatus'
    ]),

    // 处理logo点击事件
    handleLogoClick() {
      this.$refs.bluetoothList.showPopup();
      this.showBluetoothList()
    },

    // 打开语言选择器
    openLanguagePicker() {
      this.$refs.languagePopup.open()
      uni.hideTabBar({
        animation: true
      })
      
      // 抛出弹窗打开事件
      this.$emit('language-popup-action', true)
    },
    
    // 关闭语言选择器
    closeLanguagePicker() {
      this.$refs.languagePopup.close()
      uni.showTabBar({
        animation: true
      })
      
      // 抛出弹窗关闭事件
      this.$emit('language-popup-action', false)
    },
    
    // 选择语言
    selectLanguage(index) {
      const language = this.languageOptions[index].value
      this.switchLanguage(language)
      
      // 选择后自动关闭弹窗
      this.closeLanguagePicker()
    },
  }
}
</script>

<style scoped>
.battery-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.logo {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
}

.device-info {
  flex: 1;
  margin-left: 30rpx;
  line-height: 1;
}

.device-name {
  font-size: 24rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.device-status {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-top: 12rpx;
}

.status-text {
  font-size: 22rpx;
  line-height: 1;
}

.battery-info {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.battery-icon-wrapper {
  position: relative;
  margin-right: 20rpx;
  width: 120rpx;
  height: 120rpx;
}

.battery-icon {
  position: absolute;
  bottom: -24rpx;
  width: 100%;
  height: 100%;
}

.battery-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.battery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.battery-percentage {
  font-size: 60rpx;
  font-weight: bold;
  color: #333;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background-color: #e5eee2;
  border-radius: 20rpx;
  padding: 16rpx 24rpx;
  line-height: 1;
}

.country-flag {
  width: 32rpx;
  height: 32rpx;
  border-radius: 4rpx;
}

.language-text {
  font-size: 26rpx;
  color: #708270;
}

.status-indicators {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 40rpx;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

.status-dot.red {
  background-color: #FF3B30;
}

.status-dot.green {
  background-color: #34C759;
}

/* 连接失败提示样式 */
.connection-failed-tip {
  width: 100%;
  position: fixed;
  bottom: 0rpx; /* 在tabbar上方 */
  left: 50%;
  transform: translateX(-50%);
  padding: 20rpx 0;
  z-index: 98;
  text-align: center;
  background-color: #f5f5f5;
}

.tip-text {
  display: inline-block;
  width: 90%;
  font-size: 28rpx;
  color: #ffffff;
  background-color: #FF3B30;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 59, 48, 0.3);
  padding: 20rpx;
}

/* 语言选择弹出框样式 */
.language-popup {
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 0;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 40rpx 20rpx;
  border-bottom: 1px solid #F0F0F0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F5F5;
  border-radius: 50%;
}

.close-text {
  font-size: 28rpx;
  color: #666;
}

.language-list {
  padding: 20rpx 0 40rpx;
}

.language-item {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  position: relative;
  transition: background-color 0.2s;
}

.language-item:hover {
  background-color: #F8F8F8;
}

.language-item.active {
  background-color: #F0F9FF;
}

.language-icon {
  width: 48rpx;
  height: 48rpx;
  margin-right: 24rpx;
  border-radius: 4rpx;
  display: inline-block;
}

.language-name {
  flex: 1;
  font-size: 32rpx;
  color: #333;
  line-height: 1;
}

.selected-mark {
  font-size: 32rpx;
  color: #007AFF;
  font-weight: bold;
}
</style>
