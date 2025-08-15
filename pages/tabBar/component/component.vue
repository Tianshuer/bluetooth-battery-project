<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="containerStyle">
      <!-- 电池状态卡片 -->
      <BatteryCard @language-popup-action="handleLanguagePopupAction" />
      
      <!-- 电压电流卡片 -->
      <VoltageCurrentCard :voltage="safeBatteryData.totalVoltage" :current="safeBatteryData.current" />

      <!-- 电池信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.totalCapacity"
        :item1Label="labelBatteryCapacity || ''"
        :item1Unit="'AH'"
        :item2Value="safeBatteryData.ratio"
        :item2Label="labelRemainingPower || ''"
        :item2Unit="'%'"
        :item3Value="safeBatteryData.power"
        :item3Label="labelPower || ''"
        :item3Unit="'W'"
        :item4Value="safeBatteryData.cycleCapacity"
        :item4Label="labelCycleCapacity || ''"
        :item4Unit="'AH'"
      />
      <!-- 电压信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.voltageDiff"
        :item1Label="labelVoltageDiff || ''"
        :item1Unit="'V'"
        :item2Value="safeBatteryData.averageVoltage"
        :item2Label="labelAverageVoltage || ''"
        :item2Unit="'V'"
        :item3Value="safeBatteryData.maxVoltage"
        :item3Label="labelMaxVoltage || ''"
        :item3Unit="'V'"
        :item4Value="safeBatteryData.minVoltage"
        :item4Label="labelMinVoltage || ''"
        :item4Unit="'V'"
      />

      <!-- 芯片温度信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.chip1Temperature"
        :item1Label="labelChip1Temp || ''"
        :item1Unit="'°C'"
        :item2Value="safeBatteryData.chip2Temperature"
        :item2Label="labelChip2Temp || ''"
        :item2Unit="'°C'"
        :item3Value="safeBatteryData.mosTemperature"
        :item3Label="labelMosTemp || ''"
        :item3Unit="'°C'"
        :item4Value="safeBatteryData.balanceTemperature"
        :item4Label="labelBalanceTemp || ''"
        :item4Unit="'°C'"
      />
      <!-- 电芯温度信息卡片 -->
      <InfoCard 
        :item1Value="safeBatteryData.temperatures[0]"
        :item1Label="labelCellTemp1 || ''"
        :item1Unit="'°C'"
        :item2Value="safeBatteryData.temperatures[1]"
        :item2Label="labelCellTemp2 || ''"
        :item2Unit="'°C'"
        :item3Value="safeBatteryData.temperatures[2]"
        :item3Label="labelCellTemp3 || ''"
        :item3Unit="'°C'"
        :item4Value="safeBatteryData.temperatures[3]"
        :item4Label="labelCellTemp4 || ''"
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
    
    containerStyle() {
      return {
        minHeight: this.screenHeight + 'px',
        marginTop: this.statusBarHeight + 'px',
        paddingBottom: !this.isConnected ? '120rpx' : '20rpx'
      };
    },

    safeBatteryData() {
      // 直接返回当前使用的电池数据
      return this.currentBatteryData || this.getDefaultBatteryData();
    },
    labelBatteryCapacity() {
      return this.safeT('battery_capacity', '电池容量');
    },
    labelRemainingPower() {
      return this.safeT('remaining_power', '剩余电量');
    },
    labelPower() {
      return this.safeT('power', '功率');
    },
    labelCycleCapacity() {
      return this.safeT('cycle_capacity', '循环容量');
    },
    labelVoltageDiff() {
      return this.safeT('voltage_diff', '电芯压差');
    },
    labelAverageVoltage() {
      return this.safeT('average_voltage', '平均电压');
    },
    labelMaxVoltage() {
      return this.safeT('max_voltage', '最高电压');
    },
    labelMinVoltage() {
      return this.safeT('min_voltage', '最低电压');
    },
    labelChip1Temp() {
      return this.safeT('chip1_temp', '芯片1温度');
    },
    labelChip2Temp() {
      return this.safeT('chip2_temp', '芯片2温度');
    },
    labelMosTemp() {
      return this.safeT('mos_temp', 'MOS管温度');
    },
    labelBalanceTemp() {
      return this.safeT('balance_temp', '均衡温度');
    },
    labelCellTemp1() {
      return this.safeT('cell_temp1', '电芯温度1');
    },
    labelCellTemp2() {
      return this.safeT('cell_temp2', '电芯温度2');
    },
    labelCellTemp3() {
      return this.safeT('cell_temp3', '电芯温度3');
    },
    labelCellTemp4() {
      return this.safeT('cell_temp4', '电芯温度4');
    },
    
  },
  watch: {
    // 'isConnected': {
    //   handler(newConnectedState) {
    //     this.isConnected = newConnectedState;
    //     if (newConnectedState) {
    //       // 设备连接时，如果有store数据则使用，否则保持当前数据
    //       if (this.batteryData) {
    //         this.currentBatteryData = {
    //           totalVoltage: this.batteryData.totalVoltage || '0.00',
    //           voltageDiff: this.batteryData.voltageDiff || '0.0000',
    //           minVoltage: this.batteryData.minVoltage || '0.0000',
    //           maxVoltage: this.batteryData.maxVoltage || '0.0000',
    //           averageVoltage: this.batteryData.averageVoltage || '0.0000',
    //           current: this.batteryData.current || '0.00',
    //           power: this.batteryData.power || '0.00',
    //           ratio: this.batteryData.ratio || '0.00',
    //           totalCapacity: this.batteryData.totalCapacity || '0.0000',
    //           mosTemperature: this.batteryData.mosTemperature || '0.0',
    //           balanceTemperature: this.batteryData.balanceTemperature || '0.0',
    //           chip1Temperature: this.batteryData.chip1Temperature || '0.0',
    //           chip2Temperature: this.batteryData.chip2Temperature || '0.0',
    //           cycleCapacity: this.batteryData.cycleCapacity || '0.0000',
    //           temperatures: this.batteryData.temperatures || [],
    //         };
    //       }
    //       // 如果连接但没有数据，保持当前数据（可能是默认值）
    //     }
    //   },
    //   immediate: true,
    // },
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
          };
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
    safeT(key, fallback = '') {
      try {
        const res = typeof this.t === 'function' ? this.t(key) : null;
        return typeof res === 'string' && res.length ? res : fallback;
      } catch {
        return fallback;
      }
    },
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
      };
    },
    
    getScreenHeight() {
      const windowInfo = uni.getWindowInfo()
		  this.screenHeight = windowInfo.windowHeight || 667;
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