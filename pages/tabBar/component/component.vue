<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')"></page-meta>
  <view class="container" :style="{ minHeight: screenHeight + 'px' }">
    
    <!-- 电池状态卡片 -->
    <BatteryCard :batteryPercentage="batteryData.currentBatteryLevel" @language-popup-action="handleLanguagePopupAction" />
    
    <!-- 电压电流卡片 -->
    <VoltageCurrentCard :voltage="batteryData.voltage" :current="batteryData.current" />

    <!-- 电池信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.batteryCapacity"
      :item1Label="t('battery_capacity')"
      :item1Unit="'AH'"
      :item2Value="batteryData.remainingPower"
      :item2Label="t('remaining_power')"
      :item2Unit="'%'"
      :item3Value="batteryData.power"
      :item3Label="t('power')"
      :item3Unit="'W'"
      :item4Value="batteryData.cycleCapacity"
      :item4Label="t('cycle_capacity')"
      :item4Unit="'AH'"
    />
    <!-- 电压信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.cellVoltageDiff"
      :item1Label="t('voltage_diff')"
      :item1Unit="'V'"
      :item2Value="batteryData.averageVoltage"
      :item2Label="t('average_voltage')"
      :item2Unit="'V'"
      :item3Value="batteryData.maxVoltage"
      :item3Label="t('max_voltage')"
      :item3Unit="'V'"
      :item4Value="batteryData.minVoltage"
      :item4Label="t('min_voltage')"
      :item4Unit="'V'"
    />

    <!-- 芯片温度信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.chip1Temp"
      :item1Label="t('chip1_temp')"
      :item1Unit="'°C'"
      :item2Value="batteryData.chip2Temp"
      :item2Label="t('chip2_temp')"
      :item2Unit="'°C'"
      :item3Value="batteryData.mosTemp"
      :item3Label="t('mos_temp')"
      :item3Unit="'°C'"
      :item4Value="batteryData.balanceTemp"
      :item4Label="t('balance_temp')"
      :item4Unit="'°C'"
    />
    <!-- 电芯温度信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.cellTemp1"
      :item1Label="t('cell_temp1')"
      :item1Unit="'°C'"
      :item2Value="batteryData.cellTemp2"
      :item2Label="t('cell_temp2')"
      :item2Unit="'°C'"
      :item3Value="batteryData.cellTemp3"
      :item3Label="t('cell_temp3')"
      :item3Unit="'°C'"
      :item4Value="batteryData.cellTemp4"
      :item4Label="t('cell_temp4')"
      :item4Unit="'°C'"
    />
  </view>
</template>

<script>
import BatteryCard from '../../../components/BatteryCard.vue'
import VoltageCurrentCard from '../../../components/VoltageCurrentCard.vue'
import InfoCard from '../../../components/InfoCard.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    BatteryCard,
    VoltageCurrentCard,
    InfoCard
  },
  data() {
    return {
      batteryData: {
        voltage: 12.5,
        current: 2.3,
        batteryCapacity: '0.0000',
        remainingPower: '0.0000',
        power: '0.0000',
        cycleCapacity: '0.0000',
        cellVoltageDiff: '0.0000',
        averageVoltage: '0.0000',
        maxVoltage: '0.0000',
        minVoltage: '0.0000',
        chip1Temp: '0.0000',
        chip2Temp: '0.0000',
        mosTemp: '0.0000',
        balanceTemp: '0.0000',
        cellTemp1: '0.0000',
        cellTemp2: '0.0000',
        cellTemp3: '0.0000',
        cellTemp4: '0.0000'
      },
      screenHeight: 0,
      show: false,
    }
  },
  computed: {
    ...mapGetters([
      't'
    ])
  },
  onLoad() {
    this.getSystemInfo();
    this.startBatterySimulation();
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