<template>
  <view class="battery-card">
    <view class="card-header">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <view class="device-info">
        <text class="device-name">iPhone</text>
        <text class="device-status">已连接</text>
      </view>
      <view class="connection-status">
        <text class="status-text">连接成功</text>
      </view>
    </view>
    
    <view class="battery-info">
      <view class="battery-icon-wrapper">
        <image class="battery-icon" src="/static/battery-icon.png" mode="aspectFit"></image>
      </view>
      <view class="battery-content">
        <view class="battery-header">
          <text class="battery-percentage">{{ batteryPercentage }}%</text>
          <view class="language-selector" @click="openLanguagePicker">
            <image class="country-flag" :src="currentLanguage.iconUrl" mode="aspectFit"></image>
            <view class="language-text">{{ currentLanguage.shortText }}</view>
          </view>
        </view>
        <view class="status-indicators">
          <view class="status-item">
            <view class="status-dot red"></view>
            <text class="status-text">放电MOS</text>
          </view>
          <view class="status-item">
            <view class="status-dot red"></view>
            <text class="status-text">充电MOS</text>
          </view>
          <view class="status-item">
            <view class="status-dot red"></view>
            <text class="status-text">均衡</text>
          </view>
        </view>
      </view>
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
          <text class="popup-title">选择语言</text>
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
import globalStore from '../store/index.js'

export default {
  name: 'BatteryCard',
  components: {
    uniPopup
  },
  props: {
    batteryPercentage: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
    }
  },
  computed: {
    // 直接使用computed属性监听store状态变化
    currentLanguage() {
      return globalStore.getCurrentLanguage()
    },
    languageOptions() {
      return globalStore.getLanguageOptions()
    },
    currentLanguageIndex() {
      return globalStore.getCurrentLanguageIndex()
    }
  },
  methods: {
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
      // 使用全局状态管理
      globalStore.setLanguage(index)
      
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

.connection-status {
  
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
