<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="{ 
      minHeight: screenHeight + 'px',
      marginTop: statusBarHeight + 'px',
      paddingBottom: !isConnected ? '120rpx' : '20rpx',
    }">
      <!-- 电池状态卡片 -->
      <BatteryCard @language-popup-action="handleLanguagePopupAction" />
      
      <!-- 显示与控制功能组件 -->
      <CommonPanel
        :showVerifyCode="false"
        :functionButtons="controlButtons || []"
        @functionClick="handleControlClick"
      />
      
      <!-- 双列数据显示组件 - 电池串电压 -->
      <DoubleColumnData
        :dataItems="safeBatteryVoltageData || []"
        :valueFormat="voltageFormat"
      />
    </view>
  </page-meta>
</template>

<script>
    import BatteryCard from '../../../components/BatteryCard.vue';
    import CommonPanel from '../../../components/CommonPanel.vue';
    import DoubleColumnData from '../../../components/DoubleColumnData.vue';
    import { mapGetters } from 'vuex';
    import bleManager from '../../../utils/batteryManager.js';
    
    export default {
        components: {
            BatteryCard,
            CommonPanel,
            DoubleColumnData
        },
        data() {
            return {
                show: false,
                screenHeight: 0,
                currentBatteryVoltageData: [],
                // 电压格式化配置
                voltageFormat: {
                  decimals: 4,
                  padding: true
                },
            };
        },
        computed: {
            ...mapGetters([
                't',
                'isConnected',
                'isPasswordVerified',
                'statusBarHeight',
                'batteryData'
            ]),
            safeBatteryVoltageData() {
              const data = this.currentBatteryVoltageData.length > 0 ? this.currentBatteryVoltageData : this.getDefaultBatteryVoltageData();
              return Array.isArray(data) ? data : [];
            },
            // 控制按钮配置 - 响应语言变化
            controlButtons() {
              return [
                {
                  text: this.t('start_charging'),
                  action: 'chargeOn',
                  color: '#34C759'
                },
                {
                  text: this.t('stop_charging'),
                  action: 'chargeOff',
                  color: '#FF3B30'
                },
                {
                  text: this.t('start_discharging'),
                  action: 'dischargeOn',
                  color: '#FF9500'
                },
                {
                  text: this.t('stop_discharging'),
                  action: 'dischargeOff',
                  color: '#FF3B30'
                },
                {
                  text: this.t('one_key_balance'),
                  action: 'autoBalance',
                  color: '#007AFF'
                },
                {
                  text: this.t('restart_device'),
                  action: 'restartDevice',
                  color: '#AF52DE'
                }
              ];
            },
        },
        watch: {
          // 监听store中的电池数据变化，更新设备状态
          'batteryData.voltages': {
            handler(newData) {
              if (newData) {
                if (newData) {
                  this.currentBatteryVoltageData = newData.map((voltage, index) => ({
                    label: index + 1,
                    value: voltage || 0,
                    unit: 'V'
                  }));
                }
              }
            },
            immediate: true,
            deep: true
          },
        },
        onLoad() {
            this.getScreenHeight();
        },
        methods: {
          // 获取屏幕高度
          getScreenHeight() {
            const windowInfo = uni.getWindowInfo()
		        this.screenHeight = windowInfo.windowHeight || 667;
          },
            
            getDefaultBatteryVoltageData() {
              let fakeData = []
              for (let i = 0; i < 20; i++) {
                fakeData.push({
                  label: i + 1,
                  value: '0.0000',
                  unit: 'V',
                })
              }
              return fakeData;
            },
            // 连接设备
            connectDevice() {
              uni.showLoading({
                title: this.t('connecting'),
                mask: true,
              });
              
              setTimeout(() => {
                this.initializeData();
                uni.hideLoading();
                uni.showToast({
                  title: this.t('connection_success'),
                  icon: 'success'
                });
              }, 3000);
            },
            
            // 断开设备连接
            disconnectDevice() {
              console.log('断开连接');
            },
            
            // 初始化数据
            initializeData() {
              if (!this.isConnected) return;
            },

            checkBeforeControl(actionCallback) {
              // 1. 检查蓝牙连接
              if (!this.isConnected) {
                uni.showToast({
                  title: this.t('ble_not_ready'),
                  icon: 'none'
                });
                return;
              }
                  
              // 2. 检查密码验证
              if (!this.isPasswordVerified) {
                uni.showToast({
                  title: this.t('please_verify_password'),
                  icon: 'none'
                });
                return;
              }
              
              // 3. 执行操作
              actionCallback();
            },
                
            // 控制按钮点击事件
            handleControlClick({ button, index }) {
              this.checkBeforeControl(() => {
                // 密码验证通过后再执行原有逻辑
                this.doControlAction(button, index);
              });
            },
            
            // 原有控制逻辑
            doControlAction(button, index) {
              switch(button.action) {
                case 'chargeOn':
                  this.handleChargeOn();
                  break;
                case 'chargeOff':
                  this.handleChargeOff();
                  break;
                case 'dischargeOn':
                  this.handleDischargeOn();
                  break;
                case 'dischargeOff':
                  this.handleDischargeOff();
                  break;
                case 'autoBalance':
                  this.handleAutoBalance();
                  break;
                case 'restartDevice':
                  this.handleRestartDevice();
                  break;
              }
            },
            
            // 充电开启
            handleChargeOn() {
              bleManager.openCharge();
            },
            
            // 充电关闭
            handleChargeOff() {
              bleManager.closeCharge();
            },
            
            // 放电开启
            handleDischargeOn() {
              bleManager.openDischarge();
            },
            
            // 放电关闭
            handleDischargeOff() {
              bleManager.closeDischarge();
            },
            
            // 一键均衡
            handleAutoBalance() {
              bleManager.startOneKeyBalance();
            },

            // 重启设备
            handleRestartDevice() {
              bleManager.restartDevice();
            },

            // 处理语言弹窗状态变化
            handleLanguagePopupAction(isOpen) {
              this.show = isOpen;
            },
    },
  }
</script>

<style scoped>
    .container {
      display: flex;
      flex-direction: column;
      gap: 26rpx;
      background-color: #f5f5f5;
      padding: 20rpx;
      box-sizing: border-box;
    }
</style> 