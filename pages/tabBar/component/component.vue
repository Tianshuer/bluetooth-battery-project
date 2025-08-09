<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="{
        minHeight: screenHeight + 'px',
        marginTop: statusBarHeight + 'px',
        paddingBottom: !isConnected ? '120rpx' : '20rpx'
      }">
      

      
      <!-- 电池状态卡片 -->
      <BatteryCard @language-popup-action="handleLanguagePopupAction" />
      
      <!-- 电压电流卡片 -->
      <VoltageCurrentCard :voltage="safeBatteryData.totalVoltage" :current="safeBatteryData.current" />

      <!-- 电池信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.totalCapacity"
        :item1Label="t('battery_capacity') || '电池容量'"
        :item1Unit="'AH'"
        :item2Value="safeBatteryData.ratio"
        :item2Label="t('remaining_power') || '剩余电量'"
        :item2Unit="'%'"
        :item3Value="safeBatteryData.power"
        :item3Label="t('power') || '功率'"
        :item3Unit="'W'"
        :item4Value="safeBatteryData.cycleCapacity"
        :item4Label="t('cycle_capacity') || '循环容量'"
        :item4Unit="'AH'"
      />
      <!-- 电压信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.voltageDiff"
        :item1Label="t('voltage_diff') || '电芯压差'"
        :item1Unit="'V'"
        :item2Value="safeBatteryData.averageVoltage"
        :item2Label="t('average_voltage') || '平均电压'"
        :item2Unit="'V'"
        :item3Value="safeBatteryData.maxVoltage"
        :item3Label="t('max_voltage') || '最高电压'"
        :item3Unit="'V'"
        :item4Value="safeBatteryData.minVoltage"
        :item4Label="t('min_voltage') || '最低电压'"
        :item4Unit="'V'"
      />

      <!-- 芯片温度信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.chip1Temperature"
        :item1Label="t('chip1_temp') || '芯片1温度'"
        :item1Unit="'°C'"
        :item2Value="safeBatteryData.chip2Temperature"
        :item2Label="t('chip2_temp') || '芯片2温度'"
        :item2Unit="'°C'"
        :item3Value="safeBatteryData.mosTemperature"
        :item3Label="t('mos_temp') || 'MOS管温度'"
        :item3Unit="'°C'"
        :item4Value="safeBatteryData.balanceTemperature"
        :item4Label="t('balance_temp') || '均衡温度'"
        :item4Unit="'°C'"
      />
      <!-- 电芯温度信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.temperatures[0]"
        :item1Label="t('cell_temp1') || '电芯温度1'"
        :item1Unit="'°C'"
        :item2Value="safeBatteryData.temperatures[1]"
        :item2Label="t('cell_temp2') || '电芯温度2'"
        :item2Unit="'°C'"
        :item3Value="safeBatteryData.temperatures[2]"
        :item3Label="t('cell_temp3') || '电芯温度3'"
        :item3Unit="'°C'"
        :item4Value="safeBatteryData.temperatures[3]"
        :item4Label="t('cell_temp4') || '电芯温度4'"
        :item4Unit="'°C'"
      />
    </view>
  </page-meta>
</template>

<script>
import BatteryCard from '../../../components/BatteryCard.vue'
import VoltageCurrentCard from '../../../components/VoltageCurrentCard.vue'
import InfoCard from '../../../components/InfoCard.vue'
import { mapGetters, mapActions } from 'vuex'
import bleManager from '../../../utils/batteryManager.js'

export default {
  components: {
    BatteryCard,
    VoltageCurrentCard,
    InfoCard
  },
  data() {
    return {
      screenHeight: 0,
      show: false,
      localBatteryData: null, // 本地电池数据
    }
  },
  computed: {
    ...mapGetters([
      't',
      'statusBarHeight',
      'batteryData',
      'isConnected',
    ]),
    
    // 确保数据有默认值，避免页面报错
    safeBatteryData() {
      // 优先使用本地数据，如果没有则使用store数据
      const data = this.localBatteryData || this.batteryData;
      console.log('safeBatteryData - 原始数据:', data);
      
      // 测试翻译函数
      console.log('翻译测试 - battery_capacity:', this.t('battery_capacity'));
      console.log('翻译测试 - remaining_power:', this.t('remaining_power'));
      
      // 确保data是对象
      if (!data || typeof data !== 'object') {
        console.log('safeBatteryData - 数据无效，使用默认值');
        return {
          totalVoltage: '0.00',
          voltageDiff: '0.0000',
          minVoltage: '0.0000',
          maxVoltage: '0.0000',
          averageVoltage: '0.0000',
          current: '0.00',
          power: '0.00',
          ratio: '0.00',
          capacity: '0.00',
          totalCapacity: '0.0000',
          mosTemperature: '0.0',
          balanceTemperature: '0.0',
          chip1Temperature: '0.0',
          chip2Temperature: '0.0',
          cycleCapacity: '0.0000',
          temperatures: [],
          currentBatteryLevel: 0
        };
      }
      
      return {
        totalVoltage: data.totalVoltage || '0.00',
        voltageDiff: data.voltageDiff || '0.0000',
        minVoltage: data.minVoltage || '0.0000',
        maxVoltage: data.maxVoltage || '0.0000',
        averageVoltage: data.averageVoltage || '0.0000',
        current: data.current || '0.00',
        power: data.power || '0.00',
        ratio: data.ratio || '0.00',
        capacity: data.capacity || '0.00',
        totalCapacity: data.totalCapacity || '0.0000',
        mosTemperature: data.mosTemperature || '0.0',
        balanceTemperature: data.balanceTemperature || '0.0',
        chip1Temperature: data.chip1Temperature || '0.0',
        chip2Temperature: data.chip2Temperature || '0.0',
        cycleCapacity: data.cycleCapacity || '0.0000',
        temperatures: data.temperatures || [],
        currentBatteryLevel: data.currentBatteryLevel || 0
      };
    }
  },
  onLoad() {
    this.getSystemInfo();
    this.setupBatteryDataListener();
  },
  
  onShow() {
    // 页面显示时重新设置监听器
    this.setupBatteryDataListener();
  },
  
  onHide() {
    // 页面隐藏时移除监听器
    this.removeBatteryDataListener();
  },
  
  onUnload() {
    // 页面卸载时移除监听器
    this.removeBatteryDataListener();
  },
  methods: {
    ...mapActions([
      'setBatteryPercentage'
    ]),
    
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
    // 处理语言弹窗状态变化
    handleLanguagePopupAction(isOpen) {
      this.show = isOpen
    },
    
    // 设置电池数据监听器
    setupBatteryDataListener() {
      console.log('component页面设置电池数据监听器');
      console.log('BLEManager实例:', bleManager);
      
      // 移除之前的监听器
      this.removeBatteryDataListener();
      
      // 直接监听BLEManager
      this.bleManagerListener = (stateData) => {
        console.log('component页面收到BLEManager状态更新:', stateData);
        console.log('更新时间:', new Date().toLocaleTimeString());
        
        if (stateData.batteryData) {
          console.log('component页面收到电池数据更新:', stateData.batteryData);
          this.localBatteryData = stateData.batteryData;
        }
      };
      
      // 注册BLEManager监听器
      bleManager.addListener(this.bleManagerListener);
      console.log('component页面已注册BLEManager监听器');
      
      // 立即获取当前数据
      const currentData = bleManager.batteryData;
      if (currentData) {
        console.log('component页面获取到当前电池数据:', currentData);
        this.localBatteryData = currentData;
      }
    },
    
    // 移除电池数据监听器
    removeBatteryDataListener() {
      if (this.bleManagerListener) {
        bleManager.removeListener(this.bleManagerListener);
        this.bleManagerListener = null;
      }
    },
  }
}
</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  padding: 20rpx;
  box-sizing: border-box;
}
</style> 