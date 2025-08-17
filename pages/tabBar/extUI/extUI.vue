<template>
  <page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
    <view class="container" :style="{ 
      minHeight: screenHeight + 'px',
      marginTop: statusBarHeight + 'px',
      paddingBottom: (!isConnected || (isConnected && isShowYCBHAlert) || (isConnected && (gzys>0 )&& fdCloseStatusText && cdCloseStatusText))? '120rpx' : '20rpx',
    }">
      <!-- 电池状态卡片 -->
      <BatteryCard @language-popup-action="handleLanguagePopupAction" />
      
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
    <!-- 修改密码弹窗 -->
    <uni-popup ref="inputDialog" type="dialog">
      <uni-popup-dialog ref="inputClose"  mode="input" title="修改密码" :value="currentPassword" type="number"
        placeholder="请输入新密码" @confirm="dialogInputConfirm" @close="onDialogClose"></uni-popup-dialog>
    </uni-popup>
  </page-meta>
</template>

<script>
import BatteryCard from '../../../components/BatteryCard.vue'
import CommonPanel from '../../../components/CommonPanel.vue'
import FormInputList from '../../../components/FormInputList.vue'
import { mapGetters } from 'vuex'
import bleManager from '../../../utils/batteryManager.js'
import AppConstants from '../../../utils/appConstants.js'
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
import uniPopupDialog from '@/uni_modules/uni-popup/components/uni-popup-dialog/uni-popup-dialog.vue'

export default {
  components: {
    BatteryCard,
    CommonPanel,
    FormInputList,
    uniPopup,
    uniPopupDialog,
  },
  data() {
    return {
      screenHeight: 0,
      currentPassword: '',
    }
  },
  computed: {
    ...mapGetters([
      't',
      'statusBarHeight',
      'isConnected',
      'passwordVerified',
      'parameterValues',
      'isShowYCBHAlert',
      'gzys',
      'fdCloseStatusText',
      'cdCloseStatusText',
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
      // 动态生成表单配置
      const formConfigs = [];
      for (const [key, command] of Object.entries(AppConstants.parameterCommandPrefixMap)) {
        // 根据 key 获取对应的参数值和标签
        const paramValue = this.safeParameterValues[key] || '';
        const label = this.t(key);
        const unit = this.getUnitByKey(key) || '';
        const inputType = key === 'rename_device' ? 'text' : 'number';
        
        formConfigs.push({
          label,
          placeholder: this.t('input_value'),
          type: inputType,
          buttonText: this.t('send'),
          key,
          params: paramValue,
          command, // 保存对应的命令前缀
          unit,
        });
      }
      return formConfigs;
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
    getUnitByKey(key) {
      return AppConstants.parameterUnitMap[key] || '';
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
      if (item.key === 'rename_device' && !value.trim()) {
        uni.showToast({
          title: this.t('please_enter_content'),
          icon: 'none'
        });
        return;
      }
      const numValue = parseFloat(value);
      if (isNaN(numValue) && item.key !== 'rename_device') {
        uni.showToast({
          title: this.t('please_input_digital_value'),
          icon: 'none'
        });
        return;
      }
      if (item.key === 'rename_device' && value.trim()) {
        bleManager.renameDevice(value);
        return;
      }
      
      this._sendCommand(item, value);
    },
    
    stringToBytes(text) {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      bytes[i] = text.charCodeAt(i) & 0xFF;
    }
    return bytes;
  },

    _sendCommand(item, value) {
      const numValue = parseFloat(value);

      // 获取命令前缀
      const commandPrefix = this.getCommandPrefix(item.key);
      
      if (!commandPrefix) {
        console.warn('没有找到对应的命令前缀:', item.key);
        return;
      }
      const prefixData = this.stringToBytes(commandPrefix + "=");
      const suffixData = this.stringToBytes("\n");
      
      // 根据不同的参数类型决定数值的编码方式
      let valueData;
      
      if ([
        'over_voltage_protection',
        'over_voltage_recovery', 
        'under_voltage_protection',
        'under_voltage_recovery',
        'balance_voltage_diff',
        'voltage_diff_balance',
        'balance_start',
        'voltage_diff_protection'
      ].includes(item.key.trim().toLowerCase())) {
        // 电压相关：乘以10000，转为2字节
        const intValue = Math.round(numValue * 10000);
        valueData = [(intValue >> 8) & 0xFF, intValue & 0xFF];
      } else if ([
        'probe_high_temp',
        'probe_recovery_temp',
        'mos_high_temp', 
        'mos_recovery_temp',
        'balance_temperature',
        'battery_capacity',
        'current_limit'
      ].includes(item.key.trim().toLowerCase())) {
        // 温度/容量相关：乘以10，转为2字节
        const intValue = Math.round(numValue * 10);
        valueData = [(intValue >> 8) & 0xFF, intValue & 0xFF];
      } else if ([
        'over_current_protection',
        'charging_over_current',
        'short_circuit_delay'
      ].includes(item.key.trim().toLowerCase())) {
        // 电流相关：直接转为整数，2字节
        const intValue = Math.round(numValue);
        valueData = [(intValue >> 8) & 0xFF, intValue & 0xFF];
      } else if (item.key.trim().toLowerCase() === 'current_limit_debounce') {
        // 电流去抖：乘以10，1字节
        const intValue = Math.round(numValue * 10);
        valueData = [intValue & 0xFF];
      } else {
        // 默认处理：直接转为整数，1字节
        const intValue = Math.round(numValue);
        valueData = [intValue & 0xFF];
      }
      // const commandData = new Uint8Array([...prefixData, ...valueData, ...suffixData]);
      // console.log('commandData', commandData);
      const str = String.fromCharCode(...prefixData) + String.fromCharCode(...valueData) + String.fromCharCode(...suffixData);
      const commandData = this.stringToUint8Array(str);
      // 发送命令
      console.log('commandData: ', commandData, typeof commandData);
      
      bleManager.sendRawCommand(commandData);
      // this.clearFormValue(item.key);
    },
    // 清空表单值
    clearFormValue(key) {
      // 根据 key 找到对应的表单输入框并清空
      // 如果你使用的是 v-model，可以这样清空：
      if (this.formInputItems && this.formInputItems[key] !== undefined) {
        this.$set(this.formInputItems, key, '');
      }
      
      // 或者触发事件通知父组件清空
      this.$emit('clear-form-value', key);
    },

    getCommandPrefix(key) {
      return AppConstants.parameterCommandPrefixMap[key] || "";
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
      this.$refs.inputDialog.open();
    },
    dialogInputConfirm(val) {
      const numValue = parseFloat(val);
      if (isNaN(numValue)) {
        this.$refs.inputClose.val = '';
        uni.showToast({
          title: this.t('please_input_digital_value'),
          icon: 'none',
          duration: 2000,
        });
        return;
      }
      bleManager.changePassword(val);
      this.$refs.inputClose.val = '';
    },
    onDialogClose() {
      this.$refs.inputClose.val = '';
    },
    // 处理语言弹窗状态变化
    handleLanguagePopupAction(isOpen) {
      this.show = isOpen
    },
    stringToUint8Array(str) {
      if (typeof str !== 'string') {
        console.error('stringToUint8Array 期望字符串参数，收到:', typeof str);
        return new Uint8Array(0);
      }
      
      if (str.length === 0) {
        return new Uint8Array(0);
      }
      try {
        const bytes = [];
        
        for (let i = 0; i < str.length; i++) {
          const charCode = str.charCodeAt(i);
          
          // 只处理 ASCII 字符，避免复杂的 UTF-8 编码
          if (charCode < 0x80) {
            bytes.push(charCode);
          } else {
            // 对于非 ASCII 字符，使用简单的字符码转换
            bytes.push(charCode & 0xFF);
          }
        }
        
        const result = new Uint8Array(bytes);
        
        // 验证结果
        if (result.length !== bytes.length) {
          console.warn('Uint8Array 创建异常，长度不匹配');
        }
        
        return result;
            
      } catch (error) {
        console.error('字符串转换失败，使用备用方法:', error);
        
        // 备用方法：简单的字符码转换
        try {
          const arr = new Uint8Array(str.length);
          for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i) & 0xFF;
          }
          return arr;
        } catch (fallbackError) {
          console.error('备用转换方法也失败:', fallbackError);
          return new Uint8Array(0);
        }
      }
    }
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