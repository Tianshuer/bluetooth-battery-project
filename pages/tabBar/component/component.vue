<template>
  <view class="container" :style="{ minHeight: screenHeight + 'px' }">
    
    <!-- 电池状态卡片 -->
    <BatteryCard :batteryPercentage="batteryData.currentBatteryLevel" />
    
    <!-- 电压电流卡片 -->
    <VoltageCurrentCard :voltage="batteryData.voltage" :current="batteryData.current" />
    <!-- 电池信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.batteryCapacity"
      :item1Label="'电池容量'"
      :item1Unit="'AH'"
      :item2Value="batteryData.remainingPower"
      :item2Label="'剩余电量'"
      :item2Unit="'%'"
      :item3Value="batteryData.power"
      :item3Label="'功率'"
      :item3Unit="'W'"
      :item4Value="batteryData.cycleCapacity"
      :item4Label="'循环容量'"
      :item4Unit="'AH'"
    />
    <!-- 电压信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.cellVoltageDiff"
      :item1Label="'电芯压差'"
      :item1Unit="'V'"
      :item2Value="batteryData.averageVoltage"
      :item2Label="'平均电压'"
      :item2Unit="'V'"
      :item3Value="batteryData.maxVoltage"
      :item3Label="'最高电压'"
      :item3Unit="'V'"
      :item4Value="batteryData.minVoltage"
      :item4Label="'最低电压'"
      :item4Unit="'V'"
    />

    <!-- 芯片温度信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.chip1Temp"
      :item1Label="'芯片1温度'"
      :item1Unit="'°C'"
      :item2Value="batteryData.chip2Temp"
      :item2Label="'芯片2温度'"
      :item2Unit="'°C'"
      :item3Value="batteryData.mosTemp"
      :item3Label="'MOS管温度'"
      :item3Unit="'°C'"
      :item4Value="batteryData.balanceTemp"
      :item4Label="'均衡温度'"
      :item4Unit="'°C'"
    />
    <!-- 电芯温度信息卡片 -->
    <InfoCard 
      :item1Value="batteryData.cellTemp1"
      :item1Label="'电芯温度1'"
      :item1Unit="'°C'"
      :item2Value="batteryData.cellTemp2"
      :item2Label="'电芯温度2'"
      :item2Unit="'°C'"
      :item3Value="batteryData.cellTemp3"
      :item3Label="'电芯温度3'"
      :item3Unit="'°C'"
      :item4Value="batteryData.cellTemp4"
      :item4Label="'电芯温度4'"
      :item4Unit="'°C'"
    />
  </view>
</template>

<script>
import BatteryCard from '../../../components/BatteryCard.vue'
import VoltageCurrentCard from '../../../components/VoltageCurrentCard.vue'
import InfoCard from '../../../components/InfoCard.vue'

export default {
  components: {
    BatteryCard,
    VoltageCurrentCard,
    InfoCard
  },
  data() {
    return {
      batteryData: {
        currentBatteryLevel: 85,
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
    }
  },
  onLoad() {
    this.getSystemInfo();
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
    }
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