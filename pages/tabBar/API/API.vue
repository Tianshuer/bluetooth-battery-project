<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="{ 
      minHeight: screenHeight + 'px',
      marginTop: statusBarHeight + 'px',
      paddingBottom: (!isConnected || (isConnected && isShowYCBHAlert) || (isConnected && (gzys>0 )&& fdCloseStatusText && cdCloseStatusText))? '120rpx' : '20rpx',
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
    
    const CONTROL_ACTION_MAP = {
      chargeOn: 'handleChargeOn',
      chargeOff: 'handleChargeOff',
      dischargeOn: 'handleDischargeOn',
      dischargeOff: 'handleDischargeOff',
      autoBalance: 'handleAutoBalance',
      restartDevice: 'handleRestartDevice'
    };
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
                'statusBarHeight',
                'batteryData',
                'isShowYCBHAlert',
                'gzys',
                'fdCloseStatusText',
                'cdCloseStatusText',
                'parameterValues',
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
                this.currentBatteryVoltageData = [];
                const targetLength = this.parameterValues.series_number_setting  || 0;
                if (newData && newData.length > 0) {
                  // 重新构建数据
                  this.currentBatteryVoltageData = Array.from({ length: targetLength }, (_, index) => ({
                    label: index + 1,
                    value: newData && newData[index] ? newData[index] : 0,
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
                
          // 控制按钮点击事件
          handleControlClick({ button, index }) {
            this.doControlAction(button, index);
          },
          doControlAction(button, index) {
            const methodName = CONTROL_ACTION_MAP[button.action];
            if (methodName && typeof this[methodName] === 'function') {
              this[methodName]();
            } else {
              console.warn(`未知的控制动作: ${button.action}`);
            }
          },
          
          // 充电开启
          async handleChargeOn() {
            await bleManager.startCharging();
          },
          
          // 充电关闭
          async handleChargeOff() {
            await bleManager.stopCharging();
          },
          
          // 放电开启
          async handleDischargeOn() {
            await bleManager.startDischarging();
          },
          
          // 放电关闭
          async handleDischargeOff() {
            await bleManager.stopDischarging();
          },
          
          // 一键均衡
          async handleAutoBalance() {
            await bleManager.startOneKeyBalance();
          },

          // 重启设备
          async handleRestartDevice() {
            await bleManager.restartDevice();
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