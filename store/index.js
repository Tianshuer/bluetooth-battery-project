// 全局状态管理 - 使用Vue响应式系统
import Vue from 'vue'
import Vuex from 'vuex'
import zh from '../common/i18n/zh.js'
import en from '../common/i18n/en.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 语言设置
    language: 'zh', // 默认中文
    messages: zh, // 默认中文消息
    languageOptions: [{
        icon: '🇨🇳',
        iconUrl: '/static/images/china.png',
        text: '🇨🇳 中文',
        shortText: '中文',
        value: 'zh'
      },
      {
        icon: '🇺🇸',
        iconUrl: '/static/images/united-states-of-america.png',
        text: '🇺🇸 English',
        shortText: 'English',
        value: 'en'
      }
    ],

    // 语言变化触发器
    languageChangeTrigger: 0,
    // 状态栏高度
    statusBarHeight: 0,

    // 蓝牙设备信息
    batteryDevice: {
      deviceId: null,
      name: null,
      serviceId: null,
      characteristicId: null
    },

    // 获取蓝牙管理器状态
    bleManager: {
      // 连接状态
      isConnected: false,
      isScanning: false,
      isConnectionEnabled: false,

      // 设备信息
      deviceId: '',
      deviceName: '',
      versionName: '',

      // 密码验证
      passwordVerified: false,
      lastError: null,

      // 发现的设备列表
      discoveredPeripherals: [],

      // 电池数据
      batteryData: {
        level: 0,
        voltage: 0,
        current: 0,
        temperature: 0,
        isCharging: false,
        totalStrings: 0,
        balanceStatus: [],
        voltages: [],
        gzys: 0,
        chargingStatus: false,
        dischargingStatus: false,
        balancingStatus: false
      },

      // 参数值
      parameterValues: {},

      writeCharacteristic: null,

      // 电池百分比
      currentBatteryPercentage: 0,

      // 放电MOS状态
      fdCloseStatusText: '',

      // 充电MOS状态
      cdCloseStatusText: '',

      // 最低串数
      lowestString: 0,

      // 故障延时
      gzys: 0,

      // 是否显示压差保护警告
      isShowYCBHAlert: false,

    },
  },

  mutations: {
    // 设置语言
    SET_LANGUAGE(state, language) {
      state.language = language
      state.messages = language === 'en' ? en : zh
      state.languageChangeTrigger = Date.now()

      // 保存到本地存储
      uni.setStorageSync('currentLanguage', language)
    },

    // 设置密码验证状态
    SET_PASSWORD_VERIFIED(state, status) {
      state.bleManager.isPasswordVerified = status
    },

    // 设置电池百分比
    SET_CURRENT_BATTERY_PERCENTAGE(state, currentBatteryPercentage) {
      state.bleManager.currentBatteryPercentage = currentBatteryPercentage
    },

    // 设置放电MOS状态
    SET_FD_CLOSE_STATUS_TEXT(state, fdCloseStatusText) {
      state.bleManager.fdCloseStatusText = fdCloseStatusText
    },

    // 设置充电MOS状态
    SET_CD_CLOSE_STATUS_TEXT(state, cdCloseStatusText) {
      state.bleManager.cdCloseStatusText = cdCloseStatusText
    },

    // 设置最低串数
    SET_LOWEST_STRING(state, lowestString) {
      state.bleManager.lowestString = lowestString
    },

    // 设置故障延时
    SET_GZYS(state, gzys) {
      state.bleManager.gzys = gzys
    },

    // 设置是否显示压差保护警告
    SET_IS_SHOW_YCBH_ALERT(state, isShowYCBHAlert) {
      state.bleManager.isShowYCBHAlert = isShowYCBHAlert
    },

    // 触发语言变化
    TRIGGER_LANGUAGE_CHANGE(state) {
      state.languageChangeTrigger = Date.now()
    },

    // 设置状态栏高度
    SET_STATUS_BAR_HEIGHT(state, height) {
      state.statusBarHeight = height
    },

    // 更新蓝牙设备数据
    UPDATE_BLUETOOTH_DATA(state, data) {
      if (data) {
        state.bleManager.batteryData = {
          ...state.bleManager.batteryData,
          ...data
        };
      }
    },

    // 设置蓝牙设备信息
    SET_BLUETOOTH_DEVICE(state, device) {
      state.batteryDevice = {
        ...state.batteryDevice,
        ...device
      };
    },

    // 更新蓝牙管理器状态
    UPDATE_BLE_MANAGER_STATE(state, data) {
      if (data.isConnected !== undefined) state.bleManager.isConnected = data.isConnected;
      if (data.isScanning !== undefined) state.bleManager.isScanning = data.isScanning;
      if (data.isConnectionEnabled !== undefined) state.bleManager.isConnectionEnabled = data.isConnectionEnabled;
      if (data.deviceId !== undefined) state.bleManager.deviceId = data.deviceId;
      if (data.deviceName !== undefined) state.bleManager.deviceName = data.deviceName;
      if (data.versionName !== undefined) state.bleManager.versionName = data.versionName;
      if (data.passwordVerified !== undefined) state.bleManager.passwordVerified = data.passwordVerified;
      if (data.lastError !== undefined) state.bleManager.lastError = data.lastError;
      if (data.discoveredPeripherals !== undefined) state.bleManager.discoveredPeripherals = data.discoveredPeripherals;
      if (data.batteryData !== undefined) state.bleManager.batteryData = data.batteryData;
      if (data.parameterValues !== undefined) state.bleManager.parameterValues = data.parameterValues;
      if (data.writeCharacteristic !== undefined) state.bleManager.writeCharacteristic = data.writeCharacteristic;

      if (data.locale !== undefined && data.locale !== state.language) {
        this.commit('SET_LANGUAGE', data.locale);
      }
    },
  },

  actions: {
    // 切换语言
    switchLanguage({
      commit
    }, language) {
      commit('SET_LANGUAGE', language)
    },

    // 设置密码验证状态
    setPasswordVerified({
      commit
    }, status) {
      commit('SET_PASSWORD_VERIFIED', status)
    },

    // 设置电池百分比
    setCurrentBatteryPercentage({
      commit
    }, currentBatteryPercentage) {
      commit('SET_CURRENT_BATTERY_PERCENTAGE', currentBatteryPercentage)
    },

    // 设置放电MOS状态
    setFdCloseStatusText({
      commit
    }, fdCloseStatusText) {
      commit('SET_FD_CLOSE_STATUS_TEXT', fdCloseStatusText)
    },

    // 设置充电MOS状态
    setCdCloseStatusText({
      commit
    }, cdCloseStatusText) {
      commit('SET_CD_CLOSE_STATUS_TEXT', cdCloseStatusText)
    },

    // 设置最低串数
    setLowestString({
      commit
    }, lowestString) {
      commit('SET_LOWEST_STRING', lowestString)
    },

    // 设置故障延时
    setGzys({
      commit
    }, gzys) {
      commit('SET_GZYS', gzys)
    },

    // 设置是否显示压差保护警告
    setIsShowYCBHAlert({
      commit
    }, isShowYCBHAlert) {
      commit('SET_IS_SHOW_YCBH_ALERT', isShowYCBHAlert)
    },

    // 初始化语言设置
    initLanguage({
      commit
    }) {
      const savedLanguage = uni.getStorageSync('currentLanguage')
      if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
        commit('SET_LANGUAGE', savedLanguage)
      } else {
        commit('SET_LANGUAGE', 'zh')
      }
    },

    // 设置状态栏高度
    setStatusBarHeight({
      commit
    }, height) {
      commit('SET_STATUS_BAR_HEIGHT', height)
    },

    // 初始化状态栏高度
    initStatusBarHeight({
      commit
    }) {
      try {
        const windowInfo = uni.getWindowInfo()
        const statusBarHeight = windowInfo.statusBarHeight || 0

        const menuButtonHeight = uni.getMenuButtonBoundingClientRect().height || 0
        commit('SET_STATUS_BAR_HEIGHT', statusBarHeight + menuButtonHeight)
      } catch (error) {
        console.error('Vuex 状态栏高度初始化失败:', error)
      }
    },

    // 更新蓝牙设备数据
    updateBluetoothData({
      commit
    }, data) {
      commit('UPDATE_BLUETOOTH_DATA', data)
    },

    // 设置蓝牙设备信息
    setBluetoothDevice({
      commit
    }, device) {
      commit('SET_BLUETOOTH_DEVICE', device)
    },

    // 更新BLEManager状态
    updateBleManagerState({
      commit
    }, data) {
      commit('UPDATE_BLE_MANAGER_STATE', data);
    },
  },

  getters: {
    // 获取当前语言
    currentLanguage: state => state.language,

    // 获取语言选项
    languageOptions: state => state.languageOptions,

    // 获取当前语言索引
    currentLanguageIndex: state => {
      return state.languageOptions.findIndex(option => option.value === state.language)
    },

    // 翻译函数
    t: state => (key, ...args) => {
      const messages = state.messages
      let text = messages[key]

      if (!text || typeof text !== 'string') {
        console.warn(`Translation key not found or invalid: ${key}`, {
          key,
          text,
          messages
        })
        return String(key) // 确保返回字符串
      }

      // 处理参数替换
      if (args.length > 0) {
        args.forEach((arg, index) => {
          // 确保 text 仍然是字符串，并且 arg 被转换为字符串
          try {
            text = text.replace(`%d`, String(arg))
            text = text.replace(`%@`, String(arg))
          } catch (error) {
            console.error('Error in translation parameter replacement:', error, {
              text,
              arg,
              key
            })
            // 如果替换失败，至少返回原始文本
          }
        })
      }
      return text
    },

    // 连接状态
    isPasswordVerified: state => state.bleManager.isPasswordVerified,

    // 电池百分比
    currentBatteryPercentage: state => state.bleManager.currentBatteryPercentage,

    // 放电MOS状态
    fdCloseStatusText: (state) => {
      const { messages, bleManager } = state;
    
      if (!bleManager.fdCloseStatusText) {
        return '';
      }
      
      // 状态映射表
      const statusMap = {
        '单体欠压': 'single_under_voltage',
        '短路保护': 'short_circuit_protection',
        '手动关闭': 'manual_close',
        'MOS高温': 'mos_high_temp',
        '探头高温': 'probe_high_temp',
        '串数脱落': 'string_drop',
        '过流保护': 'over_current_protection',
        '延时恢复': 'delay_recovery',
      };
      
      const messageKey = statusMap[bleManager.fdCloseStatusText];
      return messageKey ? messages[messageKey] || bleManager.fdCloseStatusText : bleManager.fdCloseStatusText;
    },

    // 充电MOS状态
    cdCloseStatusText: (state) => {
      const { messages, bleManager } = state;
    
      if (!bleManager.cdCloseStatusText) {
        return '';
      }
      
      // 状态映射表
      const statusMap = {
        '短路保护': 'short_circuit_protection',
        '单体过压': 'single_over_voltage',
        '手动关闭': 'manual_close',
        'MOS高温': 'mos_high_temp',
        '探头高温': 'probe_high_temp',
        '串数脱落': 'string_drop',
        '过流保护': 'over_current_protection',
        '延时恢复': 'delay_recovery',
      };
      
      const messageKey = statusMap[bleManager.cdCloseStatusText];
      return messageKey ? messages[messageKey] || bleManager.cdCloseStatusText : bleManager.cdCloseStatusText;
    },
    // 状态栏高度
    statusBarHeight: state => state.statusBarHeight,

    // 蓝牙设备信息
    batteryDevice: state => state.batteryDevice,

    isConnected: state => state.bleManager.isConnected,
    isScanning: state => state.bleManager.isScanning,
    isConnectionEnabled: state => state.bleManager.isConnectionEnabled,
    deviceId: state => state.bleManager.deviceId,
    deviceName: state => state.bleManager.deviceName,
    versionName: state => state.bleManager.versionName,
    passwordVerified: state => state.bleManager.passwordVerified,
    lastError: state => state.bleManager.lastError,
    discoveredPeripherals: state => state.bleManager.discoveredPeripherals,
    batteryData: state => state.bleManager.batteryData,
    parameterValues: state => state.bleManager.parameterValues,
    bleManagerLocale: state => state.bleManager.locale,
    writeCharacteristic: state => state.bleManager.writeCharacteristic,
    lowestString: state => state.bleManager.lowestString,
    gzys: state => state.bleManager.gzys,
    isShowYCBHAlert: state => state.bleManager.isShowYCBHAlert,
  }
})