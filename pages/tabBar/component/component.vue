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
import { mapGetters } from 'vuex'

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
      currentBatteryData: null, // 当前使用的电池数据
    }
  },
  computed: {
    ...mapGetters([
      't',
      'statusBarHeight',
      'batteryData',
      'isConnected',
    ]),
    
    safeBatteryData() {
      // 直接返回当前使用的电池数据
      return this.currentBatteryData || this.getDefaultBatteryData();
    }
  },
  watch: {
    // 监听store中的batteryData变化
    batteryData: {
      handler(newData) {
        if (this.isConnected && newData) {
          // 设备连接且有新数据时，更新当前数据
          this.currentBatteryData = {
            totalVoltage: newData.totalVoltage || '0.00',
            voltageDiff: newData.voltageDiff || '0.0000',
            minVoltage: newData.minVoltage || '0.0000',
            maxVoltage: newData.maxVoltage || '0.0000',
            averageVoltage: newData.averageVoltage || '0.0000',
            current: newData.current || '0.00',
            power: newData.power || '0.00',
            ratio: newData.ratio || '0.00',
            totalCapacity: newData.totalCapacity || '0.0000',
            mosTemperature: newData.mosTemperature || '0.0',
            balanceTemperature: newData.balanceTemperature || '0.0',
            chip1Temperature: newData.chip1Temperature || '0.0',
            chip2Temperature: newData.chip2Temperature || '0.0',
            cycleCapacity: newData.cycleCapacity || '0.0000',
            temperatures: newData.temperatures || [],
            currentBatteryLevel: newData.currentBatteryLevel || 0
          };
        }
      },
      immediate: true,
      deep: true
    },
    
    // 监听连接状态变化
    isConnected: {
      handler(newStatus) {
        if (newStatus) {
          // 设备连接时，如果有store数据则使用，否则保持当前数据
          if (this.batteryData) {
            this.currentBatteryData = {
              totalVoltage: this.batteryData.totalVoltage || '0.00',
              voltageDiff: this.batteryData.voltageDiff || '0.0000',
              minVoltage: this.batteryData.minVoltage || '0.0000',
              maxVoltage: this.batteryData.maxVoltage || '0.0000',
              averageVoltage: this.batteryData.averageVoltage || '0.0000',
              current: this.batteryData.current || '0.00',
              power: this.batteryData.power || '0.00',
              ratio: this.batteryData.ratio || '0.00',
              totalCapacity: this.batteryData.totalCapacity || '0.0000',
              mosTemperature: this.batteryData.mosTemperature || '0.0',
              balanceTemperature: this.batteryData.balanceTemperature || '0.0',
              chip1Temperature: this.batteryData.chip1Temperature || '0.0',
              chip2Temperature: this.batteryData.chip2Temperature || '0.0',
              cycleCapacity: this.batteryData.cycleCapacity || '0.0000',
              temperatures: this.batteryData.temperatures || [],
              currentBatteryLevel: this.batteryData.currentBatteryLevel || 0
            };
          }
          // 如果连接但没有数据，保持当前数据（可能是默认值）
        }
      },
      immediate: true
    }
  },
  onLoad() {
    this.getSystemInfo();
  },
  
  methods: {
    getDefaultBatteryData() {
      return {
        totalVoltage: '0.00',
        voltageDiff: '0.0000',
        minVoltage: '0.0000',
        maxVoltage: '0.0000',
        averageVoltage: '0.0000',
        current: '0.00',
        power: '0.00',
        ratio: '0.00',
        totalCapacity: '0.0000',
        mosTemperature: '0.0',
        balanceTemperature: '0.0',
        chip1Temperature: '0.0',
        chip2Temperature: '0.0',
        cycleCapacity: '0.0000',
        temperatures: [],
        currentBatteryLevel: 0
      };
    },
    
    getSystemInfo() {
      uni.getSystemInfo({
        success: (res) => {
          this.screenHeight = res.windowHeight;
        },
        fail: () => {
          this.screenHeight = 667;
        }
      });
    },
    
    handleLanguagePopupAction(isOpen) {
      this.show = isOpen
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