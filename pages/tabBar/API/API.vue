<template>
    <view class="container" :style="{ minHeight: screenHeight + 'px' }">
        <!-- 电池状态卡片 -->
        <BatteryCard :batteryPercentage="batteryLevel" />
        
        <!-- 显示与控制功能组件 -->
        <CommonPanel
          :showVerifyCode="false"
          :functionButtons="controlButtonsConfig"
          @functionClick="handleControlClick"
        />
        
        <!-- 双列数据显示组件 - 电池串电压 -->
        <DoubleColumnData
          :dataItems="isConnected ? batteryVoltageData : []"
          :valueFormat="voltageFormat"
          :emptyConfig="voltageEmptyConfig"
          @emptyAction="handleRefreshVoltageData"
        />
    </view>
</template>

<script>
    import BatteryCard from '../../../components/BatteryCard.vue'
    import CommonPanel from '../../../components/CommonPanel.vue'
    import DoubleColumnData from '../../../components/DoubleColumnData.vue'
    import globalStore from '../../../store/index.js'
    
    export default {
        components: {
            BatteryCard,
            CommonPanel,
            DoubleColumnData
        },
        data() {
            return {
                batteryLevel: 75,
                screenHeight: 0,
                isConnected: false, // 设备连接状态
                // 显示与控制功能按钮配置
                controlButtonsConfig: [
                  {
                    text: '充电开启',
                    type: 'default',
                    action: 'chargeOn'
                  },
                  {
                    text: '放电开启',
                    type: 'info',
                    action: 'dischargeOn'
                  },
                  {
                    text: '一键均衡',
                    type: 'warning',
                    action: 'autoBalance'
                  },
                  {
                    text: '充电关闭',
                    type: 'default',
                    action: 'chargeOff'
                  },
                  {
                    text: '放电关闭',
                    type: 'info',
                    action: 'dischargeOff'
                  },
                  {
                    text: '重启设备',
                    type: 'danger',
                    action: 'restartDevice'
                  }
                ],
                // 设备状态
                deviceStatus: {
                  charging: false,
                  discharging: false,
                  balancing: false
                },
                // 电池串电压数据
                batteryVoltageData: [],
                // 电压格式化配置
                voltageFormat: {
                  decimals: 4,
                  padding: true
                },
                // 电压空态配置
                voltageEmptyConfig: {
                  title: '设备未连接',
                  description: '请检查设备连接状态\n或点击下方按钮刷新数据',
                  showButton: true,
                  buttonText: '连接设备',
                  icon: '🔋'
                }
            };
        },
        onLoad() {
            this.getSystemInfo();
            // 模拟设备连接延迟
            setTimeout(() => {
              this.connectDevice();
            }, 1000);
        },
        methods: {
            // 获取系统信息
            getSystemInfo() {
                uni.getSystemInfo({
                    success: (res) => {
                        this.screenHeight = res.windowHeight;
                    },
                    fail: (err) => {
                        console.error('获取系统信息失败:', err);
                        // 设置默认高度
                        this.screenHeight = 667;
                    }
                });
            },
            
            // 连接设备
            connectDevice() {
              uni.showLoading({
                title: '正在连接设备...'
              });
              
              setTimeout(() => {
                this.isConnected = true;
                this.initializeData();
                uni.hideLoading();
                uni.showToast({
                  title: '设备连接成功',
                  icon: 'success'
                });
              }, 3000);
            },
            
            // 断开设备连接
            disconnectDevice() {
              this.isConnected = false;
              this.batteryVoltageData = [];
              
              // 清理定时器
              if (this.voltageTimer) {
                clearInterval(this.voltageTimer);
                this.voltageTimer = null;
              }
            },
            
            // 初始化数据
            initializeData() {
              if (!this.isConnected) return;
              
              // 初始化电压数据
              this.batteryVoltageData = Array.from({ length: 34 }, (_, index) => ({
                label: (index + 7).toString(),
                value: (3.4 + Math.random() * 0.1),
                unit: 'V'
              }));
              
              this.startDataPolling();
            },
            
            // 开始数据轮询
            startDataPolling() {
              if (!this.isConnected) return;
              
              // 电压数据每3秒更新一次
              this.voltageTimer = setInterval(() => {
                if (this.isConnected && (this.deviceStatus.charging || this.deviceStatus.discharging)) {
                  this.updateVoltageData();
                }
              }, 3000);
              
            },
            
            // 刷新电压数据
            handleRefreshVoltageData() {
              if (this.isConnected) {
                this.loadVoltageData();
              } else {
                this.connectDevice();
              }
            },
            
            // 更新电压数据
            updateVoltageData() {
              if (!this.isConnected) return;
              
              this.batteryVoltageData = this.batteryVoltageData.map(item => {
                let newValue = parseFloat(item.value);
                
                if (this.deviceStatus.charging) {
                  // 充电时电压缓慢上升
                  newValue += (Math.random() - 0.3) * 0.01;
                  newValue = Math.min(4.2, newValue);
                } else if (this.deviceStatus.discharging) {
                  // 放电时电压缓慢下降
                  newValue += (Math.random() - 0.7) * 0.01;
                  newValue = Math.max(3.0, newValue);
                } else {
                  // 静置时微小波动
                  newValue += (Math.random() - 0.5) * 0.005;
                }
                
                return {
                  ...item,
                  value: Math.max(0, newValue)
                };
              });
            },
            
            checkBeforeControl(actionCallback) {
              // 1. 检查蓝牙连接
              if (!this.isConnected) {
                uni.showToast({
                  title: '蓝牙未准备好',
                  icon: 'none'
                });
                return;
              }

              // 2. 检查密码验证
              if (!globalStore.getIsPasswordVerified()) {
                uni.showToast({
                  title: '请先验证密码',
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
                title: '正在开启充电...'
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
                title: '正在关闭充电...'
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
                title: '正在开启放电...'
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
                title: '正在关闭放电...'
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
                title: '正在启动均衡...'
              });
              
              setTimeout(() => {
                this.deviceStatus.balancing = true;
                uni.hideLoading();
                uni.showToast({
                  title: '均衡已启动',
                  icon: 'success'
                });
                
                // 模拟均衡过程中电压逐渐趋于一致
                this.balanceVoltages();
                
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
            
            // 均衡电压
            balanceVoltages() {
              const targetVoltage = 3.45; // 目标电压
              this.batteryVoltageData = this.batteryVoltageData.map(item => ({
                ...item,
                value: targetVoltage + (Math.random() - 0.5) * 0.02
              }));
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
                title: '正在重启设备...'
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
                if (this.deviceStatus.charging && this.batteryLevel < 100) {
                  this.batteryLevel = Math.min(100, this.batteryLevel + 1);
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
              this.dischargingTimer = setInterval(() => {
                if (this.deviceStatus.discharging && this.batteryLevel > 0) {
                  this.batteryLevel = Math.max(0, this.batteryLevel - 1);
                }
              }, 1500);
            },
            
            // 停止放电模拟
            stopDischargingSimulation() {
              if (this.dischargingTimer) {
                clearInterval(this.dischargingTimer);
                this.dischargingTimer = null;
              }
            }
        },
        
        // 页面销毁时清理定时器
        beforeDestroy() {
          this.disconnectDevice();
        }
    };
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