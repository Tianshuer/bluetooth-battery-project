<template>
  <view class="container" :style="{ 
    minHeight: screenHeight + 'px',
    marginTop: statusBarHeight + 'px'
  }">
    <page-meta :page-style="'overflow:'+(show?'hidden':'visible')"></page-meta>
    <!-- 电池状态卡片 -->
    <BatteryCard :batteryPercentage="75" @language-popup-action="handleLanguagePopupAction" />
    
    <!-- 公共功能组件 -->
    <CommonPanel
      :showVerifyCode="true"
      :functionButtons="functionButtonsConfig"
      @sendCode="handleSendCode"
      @functionClick="handleFunctionClick"
    />
    
    <!-- 表单输入列表组件 -->
    <FormInputList
      :items="formInputItems"
      @input="handleFormInput"
      @send="handleFormSend"
    />
  </view>
</template>

<script>
import BatteryCard from '../../../components/BatteryCard.vue'
import CommonPanel from '../../../components/CommonPanel.vue'
import FormInputList from '../../../components/FormInputList.vue'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    BatteryCard,
    CommonPanel,
    FormInputList
  },
  data() {
    return {
      screenHeight: 0,
      localBatteryData: null, // 本地电池数据
    }
  },
  computed: {
    ...mapGetters([
      't',
      'languageOptions',
      'currentLanguageIndex',
      'statusBarHeight'
    ]),
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
      return [
        {
          label: this.t('series_number_setting'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'stringCount'
        },
        {
          label: this.t('over_voltage_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'overvoltageProtection'
        },
        {
          label: this.t('over_voltage_recovery'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'overvoltageRecovery'
        },
        {
          label: this.t('under_voltage_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'undervoltageProtection'
        },
        {
          label: this.t('under_voltage_recovery'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'undervoltageRecovery'
        },
        {
          label: this.t('probe_high_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'probeHighTemp'
        },
        {
          label: this.t('probe_recovery_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'probeRecovery'
        },
        {
          label: this.t('mos_high_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'mosHighTemp'
        },
        {
          label: this.t('mos_recovery_temp'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'mosRecovery'
        },
        {
          label: this.t('balance_voltage_diff'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balancePressureDiff'
        },
        {
          label: this.t('balance_temperature'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balanceTemperature'
        },
        {
          label: this.t('balance_frequency'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balanceFrequency'
        },
        {
          label: this.t('battery_capacity'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'batteryCapacity'
        },
        {
          label: this.t('voltage_diff_balance'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'pressureDiffBalance'
        },
        {
          label: this.t('balance_start'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'balanceStart'
        },
        {
          label: this.t('current_limit'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'currentFlow'
        },
        {
          label: this.t('fault_delay'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'faultDelayTime'
        },
        {
          label: this.t('over_current_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'overcurrentProtection'
        },
        {
          label: this.t('charging_over_current'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'chargingOvercurrent'
        },
        {
          label: this.t('voltage_diff_protection'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'pressureDiffProtection'
        },
        {
          label: this.t('current_limit_debounce'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'currentDebounce'
        },
        {
          label: this.t('short_circuit_delay'),
          placeholder: this.t('input_value'),
          type: 'number',
          buttonText: this.t('send'),
          key: 'shortStepDelayTime'
        },
        {
          label: this.t('bluetooth_rename'),
          placeholder: this.t('input_value'),
          type: 'text',
          buttonText: this.t('send'),
          key: 'bluetoothRename'
        }
      ]
    },
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
      'setPasswordVerified'
    ]),

    // 获取密码验证状态
    getIsPasswordVerified() {
      return this.$store.state.isPasswordVerified
    },

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
    
    // 发送验证码
    handleSendCode(code) {
      console.log('发送验证码:', code);
      if (!code) {
        uni.showToast({
          title: this.t('please_input_verify_code'),
          icon: 'none'
        });
        return;
      }
      uni.showToast({
        title: this.t('verify_code_sent_success'),
        icon: 'success'
      });
    },
    
    // 功能按钮点击
    handleFunctionClick({ button, index }) {
      if (!this.getIsPasswordVerified()) {
        uni.showToast({
          title: this.t('please_verify_password'),
          icon: 'none'
        });
        return;
      }
      console.log('功能按钮点击:', button);
      uni.showToast({
        title: this.t('clicked_button', button.text),
        icon: 'none'
      });
      
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
      if (!this.getIsPasswordVerified()) {
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
        case 'stringCount':
          this.handleStringCountSetting(value);
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
    
    // 处理串数设置
    handleStringCountSetting(value) {
      const stringCount = parseInt(value);
      if (stringCount < 1 || stringCount > 32) {
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
          title: this.t('series_count_set_success', stringCount),
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
    
    // 底部按钮点击
    handleBottomClick({ button, index }) {
      if (button.action === 'changePassword') {
        this.handleChangePassword();
      }
    },
    
    // 电池归零
    handleBatteryReset() {
      uni.showModal({
        title: this.t('tip'),
        content: this.t('confirm_battery_reset'),
        success: (res) => {
          if (res.confirm) {
            console.log('执行电池归零');
          }
        }
      });
    },
    
    // 一键铁链
    handleIronChain() {
      uni.showLoading({
        title: this.t('connecting'),
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: this.t('iron_chain_connected'),
          icon: 'success'
        });
      }, 2000);
    },
    
    // 一键钛链
    handleTitaniumChain() {
      uni.showLoading({
        title: this.t('connecting'),
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: this.t('titanium_chain_connected'),
          icon: 'success'
        });
      }, 2000);
    },
    
    // 一键三元
    handleTernary() {
      console.log('执行一键三元');
      uni.showToast({
        title: this.t('ternary_operation_done'),
        icon: 'success'
      });
    },
    
    // 修改密码
    handleChangePassword() {
      uni.navigateTo({
        url: '/pages/changePassword/changePassword'
      });
    },
    // 处理语言弹窗状态变化
    handleLanguagePopupAction(isOpen) {
      this.show = isOpen
    },
    
    // 设置电池数据监听器
    setupBatteryDataListener() {
      // 移除之前的监听器
      this.removeBatteryDataListener();
      
      // 添加新的监听器
      this.batteryDataListener = (batteryData) => {
        console.log('extUI页面收到电池数据更新:', batteryData);
        this.localBatteryData = batteryData;
      };
      
      // 监听全局事件
      uni.$on('batteryDataChanged', this.batteryDataListener);
    },
    
    // 移除电池数据监听器
    removeBatteryDataListener() {
      if (this.batteryDataListener) {
        uni.$off('batteryDataChanged', this.batteryDataListener);
        this.batteryDataListener = null;
      }
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