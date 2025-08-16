<template>
  <view class="battery-card">
    <view class="card-header">
      <image class="logo" src="/static/images/BLEIcon.png" mode="aspectFit" @click="handleLogoClick"></image>
      <view class="device-info">
        <text class="device-name">{{ deviceName || batteryDevice.name || t('unknown_device') }}</text>
        <text class="device-version">{{ versionName || t('version_unknown') }}</text>
      </view>
      <view class="connection-status">
        <switch v-if="isConnected" class="connection-switch"
          :checked="isConnected"
          @change="handleConnectionToggle"
        />
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
          <text class="battery-percentage">{{ currentBatteryPercentage }}%</text>
          <view class="language-selector" @click="openLanguagePicker">
            <image class="country-flag" :src="languageOptions[currentLanguageIndex].iconUrl" mode="aspectFit"></image>
            <view class="language-text">{{ t('language') }}</view>
          </view>
        </view>
        <view class="status-indicators">
          <!-- 放电MOS状态 -->
          <view class="status-item">
            <view class="status-item-content">
              <view class="status-dot" :class="batteryData.dischargingStatus ? 'green' : 'red'"></view>
              <text class="status-text">{{ t('discharge_mos') }}</text>
            </view>
            <view v-if="fdCloseStatusText" class="status-item-content">
              <text class="iconfont icon-warning"  :class="batteryData.dischargingStatus ? 'green' : 'red'"></text>
              <text class="status-text alert-text">{{ fdCloseStatusText }}</text>
            </view>
          </view>

          <!-- 充电MOS状态 -->
          <view class="status-item">
            <view class="status-item-content">
              <view class="status-dot" :class="batteryData.chargingStatus ? 'green' : 'red'"></view>
              <text class="status-text">{{ t('charge_mos') }}</text>
            </view>
            <view v-if="cdCloseStatusText" class="status-item-content">
              <text class="iconfont icon-warning"  :class="batteryData.chargingStatus ? 'green' : 'red'"></text>
              <text class="status-text alert-text">{{ cdCloseStatusText }}</text>
            </view>
          </view>

          <!-- 均衡状态 -->
          <view class="status-item">
            <view class="status-item-content">
              <view class="status-dot" :class="batteryData.balancingStatus ? 'green' : 'red'"></view>
              <text class="status-text">{{ t('balancing') }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 蓝牙设备列表组件 -->
    <BluetoothList ref="bluetoothList" />
    
    <!-- 连接失败提示盒子 -->
    <view v-if="!isConnected" class="banner-tip" @click="handleLogoClick">
      <text class="tip-text">{{ t('ble_disconnected_retry') }}</text>
    </view>

    <!-- 故障恢复倒计时提示 -->
    <view v-else-if="isConnected &&
      gzys > 0 &&
      fdCloseStatusText &&
      cdCloseStatusText" class="banner-tip">
      <view class="tip-text">{{ t('fault_recovery_countdown', [gzys]) }}</view>
    </view>
    <!-- 串数脱落提示 -->
    <view v-else-if="isConnected && isShowYCBHAlert" class="banner-tip">
      <view class="tip-text">{{ t('string_drop_a', [lowestString]) }}</view>
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
import bleManager from '../utils/batteryManager';

export default {
  name: 'BatteryCard',
  components: {
    uniPopup,
    BluetoothList
  },
  data() {
    return {
      switchKey: 0,
      bleListener: null,
      userInitiatedAction: false,
    }
  },
  computed: {
    ...mapGetters([
      'currentLanguage',
      'languageOptions', 
      'currentLanguageIndex',
      'isConnected',
      'isConnectionEnabled',
      't',
      'batteryDevice',
      'versionName',
      'deviceName',
      'currentBatteryPercentage',
      'batteryData',
      'fdCloseStatusText',
      'cdCloseStatusText',
      'lowestString',
      'gzys',
      'isShowYCBHAlert',
    ]),
  },
  mounted() {
    this.bleListener = (stateData) => {
      console.log('BatteryCard 蓝牙状态变化，已自动同步到Vuex', stateData);
    }
    this.ensureBleListener();
		// 初始化蓝牙状态
		bleManager._notifyListeners();
    // this.handleConnectionStateChange();
  },
  activated() {
		this.ensureBleListener();
	},
  // watch: {
  //   isConnected(newVal) {
  //     this.handleConnectionStateChange();
  //   }
  // },
  methods: {
    ...mapActions([
      'switchLanguage',
    ]),

    ensureBleListener() {
			try {
				const list = bleManager.listeners || [];
				if (!list.includes(this.bleListener)) {
					bleManager.addListener(this.bleListener);
				}
			} catch (e) {
				// 兼容没有 getters 的情况，直接尝试添加（内部会做去重）
				bleManager.addListener(this.bleListener);
			}
		},
    // 处理logo点击事件
    handleLogoClick() {
      this.ensureBleListener();
      this.$refs.bluetoothList.showPopup();
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

    // 处理连接状态切换
    async handleConnectionToggle(e) {
      const newValue = e.detail.value;
      this.userInitiatedAction = true;
      try {
        if (!newValue && this.isConnected) {
          // 检查是否有可用的设备
          if (!this.batteryDevice.deviceId) {
            uni.showToast({
              title: this.t('no_device_available'),
              icon: 'none',
              duration: 2000,
              mask: true,
            });
          }
          await bleManager.disconnect();
          console.log(this.isConnected, 111);
        } else {
          console.log('想要打开蓝牙', this.isConnected);
        }
      } catch(error) {
        console.error('error: ', error);
        // await bleManager.disconnect();
        console.log(123123, this.isConnected);
      }
    },

    // handleConnectionStateChange() {
    //   if (this.isConnected && !this.isConnectionEnabled) {
    //     this.$nextTick(() => {
    //       this.handleConnectionToggle(true);
    //     })
    //   } else if ( !this.isConnected &&
    //               this.isConnectionEnabled &&
    //               !this.userInitiatedAction
    //   ) {
    //     this.$nextTick(() => {
    //       bleManager.reconnect();
    //     })
    //   }
    //   this.$nextTick(() => {
    //     this.userInitiatedAction = false;
    //   });
    // }

  },
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
  font-size: 28rpx;;
  font-weight: bold;
  color: #333;
  display: block;
}

.device-version {
  font-size: 24rpx;;
  color: #999;
  display: block;
  margin-top: 12rpx;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.connection-switch {
  transform: scale(0.8);
  margin-right: 10rpx;
  /* 自定义 switch 样式 */
  --switch-background-color: #e5e5e5;
  --switch-checked-color: #007aff;
  --switch-border-color: #d1d1d1;
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
  display: flex;
  flex-direction: column;
  width: 80%;
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
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  margin-right: 8rpx;
  width: 33.3%
}

.status-item-content {
  display: flex;
  align-items: center;
  justify-content: start;
  margin-top: 16rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.status-dot.red {
  background-color: #FF3B30;
}

.status-dot.green {
  background-color: #34C759;
}

.status-text {
  font-size: 24rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-text {
  color: #FF3B30;
}

.icon-warning.red {
  color: #FF3B30;
}

.icon-warning.green {
  color: #34C759;
}

.icon {
  font-size: 24rpx;
  line-height: 1;
}

/* 连接失败提示样式 */
.banner-tip {
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
