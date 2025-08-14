<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="{ 
      minHeight: screenHeight + 'px',
      marginTop: statusBarHeight + 'px',
      paddingBottom: !isConnected ? '120rpx' : '20rpx',
    }">
      <!-- 电池状态卡片 -->
      <BatteryCard :batteryPercentage="75" @language-popup-action="handleLanguagePopupAction" />
      
      <!-- 公共功能组件 -->
      <CommonPanel
        :showVerifyCode="true"
        :functionButtons="functionButtonsConfig ? functionButtonsConfig : []"
        @sendCode="handleSendCode"
        @functionClick="handleFunctionClick"
      />
      
      <!-- 表单输入列表组件 -->
      <FormInputList
        :items="formInputItems ? formInputItems : []"
        @input="handleFormInput"
        @send="handleFormSend"
      />
    </view>
  </page-meta>
</template>

<script>
import BatteryCard from '../../../components/BatteryCard.vue'
import CommonPanel from '../../../components/CommonPanel.vue'
import FormInputList from '../../../components/FormInputList.vue'
import { mapGetters } from 'vuex'
import bleManager from '../../../utils/batteryManager.js'

export default {
  components: {
    BatteryCard,
    CommonPanel,
    FormInputList
  },
  data() {
    return {
      screenHeight: 0,
    }
  },
  computed: {
    ...mapGetters([
      't',
      'statusBarHeight',
      'isConnected',
      'passwordVerified',
      'parameterValues',
    ]),
    safeParameterValues() {
      return this.parameterValues || {};
    },
    // 功能按钮配置 - 响应语言变化
    functionButtonsConfig() {
      return [
        { text: this.t('battery_reset'), type: 'default', action: 'batteryReset' },
        { text: this.t('one_key_iron'), type: 'info', action: 'IronChain' },
        { text: this.t('one_key_titanium'), type: 'info', action: 'titaniumChain' },
        { text: this.t('one_key_sanyuan'), type: 'warning', action: 'ternary' },
        { text: this.t('change_password'), type: 'danger', action: 'changePassword' }
      ]
    },
    // 表单输入项配置 - 响应语言变化
    formInputItems() {
      const {
        series_number_setting,
        over_voltage_protection,
        over_voltage_recovery,
        under_voltage_protection,
        under_voltage_recovery,
        probe_high_temp,
        probe_recovery_temp,
        mos_high_temp,
        mos_recovery_temp,
        balance_voltage_diff,
        balance_temperature,
        balance_frequency,
        battery_capacity,
        voltage_diff_balance,
        balance_start,
        current_limit, 
        fault_delay,
        over_current_protection,
        charging_over_current,
        voltage_diff_protection,
        current_limit_debounce,
        short_circuit_delay,
        rename_device
      } = this.safeParameterValues;
      return [
        {
          label: this.t('series_number_setting'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'seriesNumberSetting',
          params: series_number_setting,
        },
        {
          label: this.t('over_voltage_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'overvoltageProtection',
          params: over_voltage_protection,
        },
        {
          label: this.t('over_voltage_recovery'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'overvoltageRecovery',
          params: over_voltage_recovery,
        },
        {
          label: this.t('under_voltage_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'undervoltageProtection',
          params: under_voltage_protection,
        },
        {
          label: this.t('under_voltage_recovery'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'undervoltageRecovery',
          params: under_voltage_recovery,
        },
        {
          label: this.t('probe_high_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'probeHighTemp',
          params: probe_high_temp,
        },
        {
          label: this.t('probe_recovery_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'probeRecovery',
          params: probe_recovery_temp,
        },
        {
          label: this.t('mos_high_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'mosHighTemp',
          params: mos_high_temp,
        },
        {
          label: this.t('mos_recovery_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'mosRecovery',
          params: mos_recovery_temp,
        },
        {
          label: this.t('balance_voltage_diff'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balancePressureDiff',
          params: balance_voltage_diff,
        },
        {
          label: this.t('balance_temperature'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balanceTemperature',
          params: balance_temperature,
        },
        {
          label: this.t('balance_frequency'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balanceFrequency',
          params: balance_frequency,
        },
        {
          label: this.t('battery_capacity'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'batteryCapacity',
          params: battery_capacity,
        },
        {
          label: this.t('voltage_diff_balance'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'pressureDiffBalance',
          params: voltage_diff_balance,
        },
        {
          label: this.t('balance_start'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balanceStart',
          params: balance_start,
        },
        {
          label: this.t('current_limit'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'currentFlow',
          params: current_limit,
        },
        {
          label: this.t('fault_delay'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'faultDelayTime',
          params: fault_delay,
        },
        {
          label: this.t('over_current_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'overcurrentProtection',
          params: over_current_protection,
        },
        {
          label: this.t('charging_over_current'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'chargingOvercurrent',
          params: charging_over_current,
        },
        {
          label: this.t('voltage_diff_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'pressureDiffProtection',
          params: voltage_diff_protection,
        },
        {
          label: this.t('current_limit_debounce'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'currentDebounce',
          params: current_limit_debounce,
        },
        {
          label: this.t('short_circuit_delay'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'shortStepDelayTime',
          params: short_circuit_delay,
        },
        {
          label: this.t('bluetooth_rename'),
          placeholder: this.t('input_value'),
          type: 'text',
          buttonText: this.t('send'),
          key: 'bluetoothRename',
          params: rename_device,
        }
      ]
    },
  },
  onLoad() {
    this.getScreenHeight();
  },
  methods: {
    // 获取系统信息
    getScreenHeight() {
      const windowInfo = uni.getWindowInfo()
		  this.screenHeight = windowInfo.windowHeight || 667;
    },
    
    // 发送验证码
    handleSendCode(code) {
      bleManager.verifyPassword(code);
    },
    
    // 功能按钮点击
    handleFunctionClick({ button, index }) {

      if (!this.passwordVerified) {
        uni.showToast({
          title: this.t('please_verify_password'),
          icon: 'none'
        });
        return;
      }
      // 根据action执行对应的操作
      switch(button.action) {
        case 'batteryReset':
          this.handleBatteryReset();
          break;
        case 'IronChain':
          this.handleIronChain();
          break;
        case 'titaniumChain':
          this.handleTitaniumChain();
          break;
        case 'ternary':
          this.handleTernary();
          break;
        case 'changePassword':
          this.handleChangePassword();
          break;
      }
    },
    
    // 表单输入事件
    handleFormInput({ item, index, value }) {
      console.log('表单输入:', {
        label: item.label,
        key: item.key,
        value: value,
        index: index
      });
    },
    
    // 表单发送事件
    handleFormSend({ item, index, value }) {
      console.log('表单发送:', {
        label: item.label,
        key: item.key,
        value: value,
        index: index
      });
      if (!this.passwordVerified) {
        uni.showToast({
          title: this.t('please_verify_password'),
          icon: 'none'
        });
        return;
      }

      if (!value.trim()) { 
        uni.showToast({
          title: this.t('please_input_value', item.label),
          icon: 'none'
        });
        return;
      }
      
      // 根据不同的表单项执行不同的逻辑
      switch(item.key) {
        case 'seriesNumberSetting':
          this.handleSeriesNumberSettingSetting(value);
          break;
        case 'overvoltageProtection':
        case 'overvoltageRecovery':
        case 'undervoltageProtection':
        case 'undervoltageRecovery':
          this.handleVoltageSettings(item, value);
          break;
        case 'probeHighTemp':
        case 'probeRecovery':
        case 'mosHighTemp':
        case 'mosRecovery':
          this.handleTemperatureSettings(item, value);
          break;
        case 'balancePressureDiff':
        case 'balanceTemperature':
        case 'balanceFrequency':
        case 'balanceStart':
          this.handleBalanceSettings(item, value);
          break;
        case 'batteryCapacity':
          this.handleBatteryCapacitySettings(value);
          break;
        case 'currentFlow':
        case 'overcurrentProtection':
        case 'chargingOvercurrent':
        case 'currentDebounce':
          this.handleCurrentSettings(item, value);
          break;
        case 'bluetoothRename':
          this.handleBluetoothRename(value);
          break;
        default:
          this.handleGeneralSettings(item, value);
      }
    },
    
    // 串数设置
    handleSeriesNumberSettingSetting(value) {
      const seriesNumberSetting = parseInt(value);
      if (seriesNumberSetting < 1 || seriesNumberSetting > 32) {
        uni.showToast({
          title: this.t('series_count_range_error'),
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: this.t('setting_series_count'),
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: this.t('series_count_set_success', seriesNumberSetting),
          icon: 'success'
        });
      }, 1500);
    },
    
    // 处理电压相关设置
    handleVoltageSettings(item, value) {
      const voltage = parseFloat(value);
      if (voltage < 0 || voltage > 5) {
        uni.showToast({
          title: this.t('voltage_range_error'),
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: this.t('setting_success', item.label),
        icon: 'success'
      });
    },
    
    // 处理温度相关设置
    handleTemperatureSettings(item, value) {
      const temperature = parseInt(value);
      if (temperature < -40 || temperature > 85) {
        uni.showToast({
          title: this.t('temperature_range_error'),
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: this.t('setting_success', item.label),
        icon: 'success'
      });
    },
    
    // 处理均衡相关设置
    handleBalanceSettings(item, value) {
      uni.showLoading({
        title: this.t('setting_balance', item.label),
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: this.t('setting_success', item.label),
          icon: 'success'
        });
      }, 1000);
    },
    
    // 处理电池容量设置
    handleBatteryCapacitySettings(value) {
      const capacity = parseInt(value);
      if (capacity < 1 || capacity > 100000) {
        uni.showToast({
          title: this.t('battery_capacity_range_error'),
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: this.t('battery_capacity_set_success', capacity),
        icon: 'success'
      });
    },
    
    // 处理电流相关设置
    handleCurrentSettings(item, value) {
      const current = parseFloat(value);
      if (current < 0 || current > 200) {
        uni.showToast({
          title: this.t('current_range_error'),
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: this.t('setting_success', item.label),
        icon: 'success'
      });
    },
    
    // 处理蓝牙改名
    handleBluetoothRename(value) {
      if (value.length < 3 || value.length > 20) {
        uni.showToast({
          title: this.t('bluetooth_name_length_error'),
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: this.t('changing_bluetooth_name'),
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: this.t('bluetooth_name_changed', value),
          icon: 'success'
        });
      }, 2000);
    },
    
    // 处理通用设置
    handleGeneralSettings(item, value) {
      uni.showToast({
        title: this.t('setting_success', item.label),
        icon: 'success'
      });
    },
    
    // 电池重置
    handleBatteryReset() {
      bleManager.resetCurrent();
    },
    
    // 一键铁锂
    handleIronChain() {
      bleManager.setFeLiBattery();
    },
    
    // 一键钛锂
    handleTitaniumChain() {
      bleManager.setTiLiBattery();
    },
    
    // 一键三元
    handleTernary() {
      bleManager.setSanyuanBattery();
    },
    
    // 修改密码
    handleChangePassword() {
      console.log(123456789);
      // 修改密码最后做
      // if (bleManager.guardPasswordVerified()) {
      //   uni.showToast({
      //     title: this.t('please_verify_password'),
      //     icon: 'none'
      //   });
      //   if (changePassword)
      //   return;
      // }
      // uni.navigateTo({
      //   url: '/pages/changePassword/changePassword'
      // });
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
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  background-color: #f5f5f5;
  padding: 20rpx;
  box-sizing: border-box;
}
</style> 