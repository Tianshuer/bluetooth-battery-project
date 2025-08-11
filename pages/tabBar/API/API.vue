<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="{ 
      minHeight: screenHeight + 'px',
      marginTop: statusBarHeight + 'px',
      paddingBottom: !isConnected ? '120rpx' : '20rpx',
    }">
      <!-- 电池状态卡片 -->
      <BatteryCard :batteryPercentage="batteryLevel" @language-popup-action="handleLanguagePopupAction" />
      
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
    import BatteryCard from '../../../components/BatteryCard.vue'
    import CommonPanel from '../../../components/CommonPanel.vue'
    import DoubleColumnData from '../../../components/DoubleColumnData.vue'
    import { mapGetters } from 'vuex'
    
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
                // 设备状态
                deviceStatus: {
                  charging: false,
                  discharging: false,
                  balancing: false
                },
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
          batteryLevel: {
            handler(newData) {
              this.batteryLevel = newData;
            },
            immediate: true,
            deep: true
          },
          // 监听store中的电池数据变化，更新设备状态
          batteryData: {
            handler(newData) {
              if (newData) {
                this.deviceStatus = {
                  charging: newData.chargingStatus || false,
                  discharging: newData.dischargingStatus || false,
                  balancing: newData.balancingStatus || false
                };
                if (newData.voltages) {
                  this.currentBatteryVoltageData = newData.voltages.map((voltage, index) => ({
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
              
              // 确保 deviceStatus 已初始化
              if (!this.deviceStatus) {
                this.deviceStatus = {
                  charging: false,
                  discharging: false,
                  balancing: false
                };
              }
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
              if (this.deviceStatus.charging) {
                uni.showToast({
                  title: '充电已经开启',
                  icon: 'none'
                });
                return;
              }
              
              if (this.deviceStatus.discharging) {
                uni.showToast({
                  title: '请先关闭放电',
                  icon: 'none'
                });
                return;
              }
              
              uni.showLoading({
                title: '正在开启充电...',
                mask: true
              });
              
              setTimeout(() => {
                this.deviceStatus.charging = true;
                uni.hideLoading();
                uni.showToast({
                  title: '充电已开启',
                  icon: 'success'
                });
                
                // 模拟电池电量增加
                this.startChargingSimulation();
              }, 1500);
            },
            
            // 充电关闭
            handleChargeOff() {
              if (!this.deviceStatus.charging) {
                uni.showToast({
                  title: '充电未开启',
                  icon: 'none'
                });
                return;
              }
              
              uni.showLoading({
                title: '正在关闭充电...',
                mask: true
              });
              
              setTimeout(() => {
                this.deviceStatus.charging = false;
                this.stopChargingSimulation();
                uni.hideLoading();
                uni.showToast({
                  title: '充电已关闭',
                  icon: 'success'
                });
              }, 1000);
            },
            
            // 放电开启
            handleDischargeOn() {
              if (this.deviceStatus.discharging) {
                uni.showToast({
                  title: '放电已经开启',
                  icon: 'none'
                });
                return;
              }
              
              if (this.deviceStatus.charging) {
                uni.showToast({
                  title: '请先关闭充电',
                  icon: 'none'
                });
                return;
              }
              
              uni.showLoading({
                title: '正在开启放电...',
                mask: true
              });
              
              setTimeout(() => {
                this.deviceStatus.discharging = true;
                uni.hideLoading();
                uni.showToast({
                  title: '放电已开启',
                  icon: 'success'
                });
                
                // 模拟电池电量减少
                this.startDischargingSimulation();
              }, 1500);
            },
            
            // 放电关闭
            handleDischargeOff() {
              if (!this.deviceStatus.discharging) {
                uni.showToast({
                  title: '放电未开启',
                  icon: 'none'
                });
                return;
              }
              
              uni.showLoading({
                title: '正在关闭放电...',
                mask: true
              });
              
              setTimeout(() => {
                this.deviceStatus.discharging = false;
                this.stopDischargingSimulation();
                uni.hideLoading();
                uni.showToast({
                  title: '放电已关闭',
                  icon: 'success'
                });
              }, 1000);
            },
            
            // 一键均衡
            handleAutoBalance() {
              if (this.deviceStatus.balancing) {
                uni.showToast({
                  title: '均衡正在进行中',
                  icon: 'none'
                });
                return;
              }
              
              uni.showModal({
                title: '确认操作',
                content: '确定要开始一键均衡吗？此过程可能需要较长时间。',
                success: (res) => {
                  if (res.confirm) {
                    this.startBalancing();
                  }
                }
              });
            },
            
            // 开始均衡
            startBalancing() {
              uni.showLoading({
                title: '正在启动均衡...',
                mask: true
              });
              
              setTimeout(() => {
                this.deviceStatus.balancing = true;
                uni.hideLoading();
                uni.showToast({
                  title: '均衡已启动',
                  icon: 'success'
                });
                
                // 模拟均衡过程
                setTimeout(() => {
                  this.deviceStatus.balancing = false;
                  uni.showToast({
                    title: '均衡完成',
                    icon: 'success'
                  });
                }, 10000); // 10秒后完成均衡
              }, 2000);
            },
            
            // 重启设备
            handleRestartDevice() {
              uni.showModal({
                title: '确认重启',
                content: '确定要重启设备吗？重启过程中会暂时断开连接。',
                confirmColor: '#FF3B30',
                success: (res) => {
                  if (res.confirm) {
                    this.restartDevice();
                  }
                }
              });
            },
            
            // 执行重启
            restartDevice() {
              uni.showLoading({
                title: '正在重启设备...',
                mask: true
              });
              
              // 断开连接并重置状态
              this.disconnectDevice();
              this.deviceStatus = {
                charging: false,
                discharging: false,
                balancing: false
              };
              
              setTimeout(() => {
                uni.hideLoading();
                uni.showToast({
                  title: '设备重启完成',
                  icon: 'success'
                });
                
                // 重新连接设备
                setTimeout(() => {
                  this.connectDevice();
                }, 1000);
              }, 3000);
            },
            
            // 充电模拟
            startChargingSimulation() {
              this.chargingTimer = setInterval(() => {
                if (this.deviceStatus.charging) {
                  // 这里可以根据实际需求进行充电模拟
                  console.log('充电模拟中...');
                }
              }, 2000);
            },
            
            // 停止充电模拟
            stopChargingSimulation() {
              if (this.chargingTimer) {
                clearInterval(this.chargingTimer);
                this.chargingTimer = null;
              }
            },
            
            // 放电模拟
            startDischargingSimulation() {
              console.log('放电模拟');
            },
            
            // 停止放电模拟
            stopDischargingSimulation() {
              if (this.dischargingTimer) {
                clearInterval(this.dischargingTimer);
                this.dischargingTimer = null;
              }
            },

            // 处理语言弹窗状态变化
            handleLanguagePopupAction(isOpen) {
              this.show = isOpen
      }
    },
  }
</script>

<style scoped>
    .container {
        display: flex;
        flex-direction: column;
        gap: 26rpx;
        background-color: #f8f8f8;
        padding: 20rpx;
        box-sizing: border-box;
    }
</style> 