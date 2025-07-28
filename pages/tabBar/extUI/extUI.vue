<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')"></page-meta>
  <view class="container" :style="{ minHeight: screenHeight + 'px' }">
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

export default {
  components: {
    BatteryCard,
    CommonPanel,
    FormInputList
  },
  data() {
    return {
      screenHeight: 0,
      functionButtonsConfig: [
        { text: '电池归零', type: 'default', action: 'batteryReset' },
        { text: '一键铁链', type: 'info', action: 'IronChain' },
        { text: '一键钛链', type: 'info', action: 'titaniumChain' },
        { text: '一键三元', type: 'warning', action: 'ternary' },
        { text: '修改密码', type: 'danger', action: 'changePassword' }
      ],
      // 表单输入项配置 - 完整的22项数据
      formInputItems: [
        {
          label: '串数设置',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'stringCount'
        },
        {
          label: '过压保护',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'overvoltageProtection'
        },
        {
          label: '过压恢复',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'overvoltageRecovery'
        },
        {
          label: '欠压保护',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'undervoltageProtection'
        },
        {
          label: '欠压恢复',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'undervoltageRecovery'
        },
        {
          label: '探头高温',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'probeHighTemp'
        },
        {
          label: '探头恢复',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'probeRecovery'
        },
        {
          label: 'MOS高温',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'mosHighTemp'
        },
        {
          label: 'MOS恢复',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'mosRecovery'
        },
        {
          label: '均衡压差',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'balancePressureDiff'
        },
        {
          label: '均衡温度',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'balanceTemperature'
        },
        {
          label: '均衡频率',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'balanceFrequency'
        },
        {
          label: '电池容量',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'batteryCapacity'
        },
        {
          label: '压差均衡',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'pressureDiffBalance'
        },
        {
          label: '均衡启动',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'balanceStart'
        },
        {
          label: '当前电流',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'currentFlow'
        },
        {
          label: '故蹿廷时',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'faultDelayTime'
        },
        {
          label: '过流保护',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'overcurrentProtection'
        },
        {
          label: '充电过流',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'chargingOvercurrent'
        },
        {
          label: '压差保护',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'pressureDiffProtection'
        },
        {
          label: '电流消抖',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'currentDebounce'
        },
        {
          label: '短踏廷时',
          placeholder: '请输入',
          type: 'number',
          buttonText: '发送',
          key: 'shortStepDelayTime'
        },
        {
          label: '蓝牙改名',
          placeholder: '请输入',
          type: 'text',
          buttonText: '发送',
          key: 'bluetoothRename'
        }
      ],
      show: false,
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
    },
    
    // 发送验证码
    handleSendCode(code) {
      console.log('发送验证码:', code);
      if (!code) {
        uni.showToast({
          title: '请输入验证码',
          icon: 'none'
        });
        return;
      }
      uni.showToast({
        title: '验证码发送成功',
        icon: 'success'
      });
    },
    
    // 功能按钮点击
    handleFunctionClick({ button, index }) {
      console.log('功能按钮点击:', button);
      uni.showToast({
        title: `点击了${button.text}`,
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
      
      if (!value.trim()) {
        uni.showToast({
          title: `请输入${item.label}`,
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
          title: '串数范围应在1-32之间',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: '正在设置串数...',
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: `串数设置为${stringCount}成功`,
          icon: 'success'
        });
      }, 1500);
    },
    
    // 处理电压相关设置
    handleVoltageSettings(item, value) {
      const voltage = parseFloat(value);
      if (voltage < 0 || voltage > 5) {
        uni.showToast({
          title: '电压值应在0-5V之间',
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: `${item.label}设置成功`,
        icon: 'success'
      });
    },
    
    // 处理温度相关设置
    handleTemperatureSettings(item, value) {
      const temperature = parseInt(value);
      if (temperature < -40 || temperature > 85) {
        uni.showToast({
          title: '温度值应在-40°C到85°C之间',
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: `${item.label}设置成功`,
        icon: 'success'
      });
    },
    
    // 处理均衡相关设置
    handleBalanceSettings(item, value) {
      uni.showLoading({
        title: `正在设置${item.label}...`,
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: `${item.label}设置成功`,
          icon: 'success'
        });
      }, 1000);
    },
    
    // 处理电池容量设置
    handleBatteryCapacitySettings(value) {
      const capacity = parseInt(value);
      if (capacity < 1 || capacity > 100000) {
        uni.showToast({
          title: '电池容量范围应在1-100000mAh之间',
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: `电池容量设置为${capacity}mAh`,
        icon: 'success'
      });
    },
    
    // 处理电流相关设置
    handleCurrentSettings(item, value) {
      const current = parseFloat(value);
      if (current < 0 || current > 200) {
        uni.showToast({
          title: '电流值应在0-200A之间',
          icon: 'none'
        });
        return;
      }
      
      uni.showToast({
        title: `${item.label}设置成功`,
        icon: 'success'
      });
    },
    
    // 处理蓝牙改名
    handleBluetoothRename(value) {
      if (value.length < 3 || value.length > 20) {
        uni.showToast({
          title: '蓝牙名称长度应在3-20字符之间',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: '正在修改蓝牙名称...',
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: `蓝牙名称已改为"${value}"`,
          icon: 'success'
        });
      }, 2000);
    },
    
    // 处理通用设置
    handleGeneralSettings(item, value) {
      uni.showToast({
        title: `${item.label}设置成功`,
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
        title: '提示',
        content: '确定要执行电池归零操作吗？',
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
        title: '正在连接...',
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '铁链连接成功',
          icon: 'success'
        });
      }, 2000);
    },
    
    // 一键钛链
    handleTitaniumChain() {
      uni.showLoading({
        title: '正在连接...',
        mask: true
      });
      
      setTimeout(() => {
        uni.hideLoading();
        uni.showToast({
          title: '钛链连接成功',
          icon: 'success'
        });
      }, 2000);
    },
    
    // 一键三元
    handleTernary() {
      console.log('执行一键三元');
      uni.showToast({
        title: '三元操作完成',
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