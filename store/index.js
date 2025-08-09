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
    // 连接状态
    isConnected: false,
    // 密码验证状态
    isPasswordVerified: false,
    // 语言变化触发器
    languageChangeTrigger: 0,
    // 电池百分比
    batteryPercentage: 0,
    // 状态栏高度
    statusBarHeight: 0,
    // 蓝牙设备数据
    batteryData: {
      // 电压相关
      totalVoltage: '0.00',
      voltageDiff: '0.0000',
      lowestString: 0,
      highestString: 0,
      minVoltage: '0.0000',
      maxVoltage: '0.0000',
      averageVoltage: '0.0000',

      // 电流和功率
      current: '0.00',
      power: '0.00',
      ratio: '0.00',

      // 容量相关
      capacity: '0.0000',
      totalCapacity: '0.0000',

      // 温度相关
      mosTemperature: '0.0',
      balanceTemperature: '0.0',
      chip1Temperature: '0.0',
      chip2Temperature: '0.0',

      // 均衡相关
      balanceStatus: [],

      // 数组数据
      voltages: [], // 确保初始化为空数组
      temperatures: [],

      // 其他属性
      stringDrop: 0,
      dataQuality: 'normal',

      cycleCapacity: '0.0000',

      batteryCapacity: '0.0000',
      remainingPower: '0.00',
      power: '0.00',
      chip1Temp: '0.0',
      chip2Temp: '0.0',
      mosTemp: '0.0',
      balanceTemp: '0.0',
      cellTemp1: '0.0',
      cellTemp2: '0.0',
      cellTemp3: '0.0',
      cellTemp4: '0.0',
      currentBatteryLevel: 0,
    },
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

      // 语言设置
      locale: 'zh'
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

    // 设置连接状态
    SET_CONNECTION_STATUS(state, status) {
      state.isConnected = status
    },

    // 设置密码验证状态
    SET_PASSWORD_VERIFIED(state, status) {
      state.isPasswordVerified = status
    },

    // 触发语言变化
    TRIGGER_LANGUAGE_CHANGE(state) {
      state.languageChangeTrigger = Date.now()
    },

    // 设置电池百分比
    SET_BATTERY_PERCENTAGE(state, percentage) {
      state.batteryPercentage = percentage
    },

    // 设置状态栏高度
    SET_STATUS_BAR_HEIGHT(state, height) {
      state.statusBarHeight = height
    },

    // 更新蓝牙设备数据
    UPDATE_BLUETOOTH_DATA(state, data) {
      if (data) {
        state.batteryData = {
          ...state.batteryData,
          ...data
        };
        // 计算电池百分比
        // const maxVoltage = 4.2;
        // const minVoltage = 3.0;
        const currentVoltage = parseFloat(state.batteryData.totalVoltage) || 0;
        let percentage = ((currentVoltage - state.batteryData.minVoltage) / (state.batteryData.maxVoltage - state.batteryData.minVoltage)) * 100;
        percentage = Math.min(Math.max(percentage, 0), 100);
        console.log('percentage', percentage);

        state.batteryPercentage = Number(percentage.toFixed(2));
      }
    },

    // 设置蓝牙设备信息
    SET_BLUETOOTH_DEVICE(state, device) {
      state.batteryDevice = {
        ...state.batteryDevice,
        ...device
      };
    },

    // 重置蓝牙数据
    RESET_BLUETOOTH_DATA(state) {
      state.batteryData = {
        voltage: '0.00',
        current: '0.00',
        batteryCapacity: '0.0000',
        remainingPower: '0.00',
        power: '0.00',
        cycleCapacity: '0.0000',
        voltageDiff: '0.0000',
        averageVoltage: '0.0000',
        maxVoltage: '0.0000',
        minVoltage: '0.0000',
        chip1Temp: '0.0',
        chip2Temp: '0.0',
        mosTemp: '0.0',
        balanceTemp: '0.0',
        cellTemp1: '0.0',
        cellTemp2: '0.0',
        cellTemp3: '0.0',
        cellTemp4: '0.0',
        currentBatteryLevel: 0,
      };
      state.batteryPercentage = 0;
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
      if (data.locale !== undefined) state.bleManager.locale = data.locale;
    },

    UPDATE_DISCOVERED_PERIPHERALS(state, peripherals) {
      state.bleManager.discoveredPeripherals = peripherals;
    },

    // 更新电池数据
    UPDATE_BATTERY_DATA(state, batteryData) {
      state.bleManager.batteryData = {
        ...state.bleManager.batteryData,
        ...batteryData
      };
    },

    // 更新连接状态
    UPDATE_CONNECTION_STATUS(state, {
      isConnected,
      deviceId,
      deviceName,
      versionName
    }) {
      state.bleManager.isConnected = isConnected;
      if (deviceId) state.bleManager.deviceId = deviceId;
      if (deviceName) state.bleManager.deviceName = deviceName;
      if (versionName) state.bleManager.versionName = versionName;
    },

    // 更新扫描状态
    UPDATE_SCANNING_STATUS(state, isScanning) {
      state.bleManager.isScanning = isScanning;
    },

    // 更新密码验证状态
    UPDATE_PASSWORD_VERIFIED(state, passwordVerified) {
      state.bleManager.passwordVerified = passwordVerified;
    },

    // 更新错误信息
    UPDATE_LAST_ERROR(state, lastError) {
      state.bleManager.lastError = lastError;
    },

    // 更新参数值
    UPDATE_PARAMETER_VALUES(state, parameterValues) {
      state.bleManager.parameterValues = {
        ...state.bleManager.parameterValues,
        ...parameterValues
      };
    },

    // 重置BLEManager状态
    RESET_BLE_MANAGER_STATE(state) {
      state.bleManager = {
        isConnected: false,
        isScanning: false,
        isConnectionEnabled: false,
        deviceId: '',
        deviceName: '',
        versionName: '',
        passwordVerified: false,
        lastError: null,
        discoveredPeripherals: [],
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
        parameterValues: {},
        locale: 'zh'
      };
    }
  },

  actions: {
    // 切换语言
    switchLanguage({
      commit
    }, language) {
      commit('SET_LANGUAGE', language)
    },

    // 设置连接状态
    setConnectionStatus({
      commit
    }, status) {
      commit('SET_CONNECTION_STATUS', status)
    },

    // 设置密码验证状态
    setPasswordVerified({
      commit
    }, status) {
      commit('SET_PASSWORD_VERIFIED', status)
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

    // 设置电池百分比
    setBatteryPercentage({
      commit
    }, percentage) {
      commit('SET_BATTERY_PERCENTAGE', percentage)
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

    // 重置蓝牙数据
    resetBluetoothData({
      commit
    }) {
      commit('RESET_BLUETOOTH_DATA')
    },
    // 更新蓝牙管理器状态
    // updateBleManagerState({ commit }, data) {
    //   commit('UPDATE_BLE_MANAGER_STATE', data);
    // }

    // ------------
    // 更新BLEManager状态
    updateBleManagerState({
      commit
    }, data) {
      console.log(787878773637);
      
      commit('UPDATE_BLE_MANAGER_STATE', data);
    },

    // 更新发现的设备列表
    updateDiscoveredPeripherals({
      commit
    }, peripherals) {
      commit('UPDATE_DISCOVERED_PERIPHERALS', peripherals);
    },

    // 更新电池数据
    updateBatteryData({
      commit
    }, batteryData) {
      commit('UPDATE_BATTERY_DATA', batteryData);
    },

    // 更新连接状态
    updateConnectionStatus({
      commit
    }, {
      isConnected,
      deviceId,
      deviceName,
      versionName
    }) {
      commit('UPDATE_CONNECTION_STATUS', {
        isConnected,
        deviceId,
        deviceName,
        versionName
      });
    },

    // 更新扫描状态
    updateScanningStatus({
      commit
    }, isScanning) {
      commit('UPDATE_SCANNING_STATUS', isScanning);
    },

    // 更新密码验证状态
    updatePasswordVerified({
      commit
    }, passwordVerified) {
      commit('UPDATE_PASSWORD_VERIFIED', passwordVerified);
    },

    // 更新错误信息
    updateLastError({
      commit
    }, lastError) {
      commit('UPDATE_LAST_ERROR', lastError);
    },

    // 更新参数值
    updateParameterValues({
      commit
    }, parameterValues) {
      commit('UPDATE_PARAMETER_VALUES', parameterValues);
    },

    // 重置BLEManager状态
    resetBleManagerState({
      commit
    }) {
      commit('RESET_BLE_MANAGER_STATE');
    }
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
        console.warn(`Translation key not found or invalid: ${key}`, { key, text, messages })
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
            console.error('Error in translation parameter replacement:', error, { text, arg, key })
            // 如果替换失败，至少返回原始文本
          }
        })
      }
      return text
    },

    // 格式化方法
    formatVoltage: state => (voltage) => {
      const messages = state.messages
      return `${Number(voltage).toFixed(2)}${messages.voltage_unit || 'V'}`
    },

    formatCurrent: state => (current) => {
      const messages = state.messages
      return `${Number(current).toFixed(2)}${messages.current_unit || 'A'}`
    },

    formatPower: state => (power) => {
      const messages = state.messages
      return `${Number(power).toFixed(2)}${messages.power_unit || 'W'}`
    },

    formatTemperature: state => (temp) => {
      const messages = state.messages
      return `${Number(temp).toFixed(2)}${messages.temperature_unit || '°C'}`
    },

    formatCapacity: state => (capacity) => {
      const messages = state.messages
      return `${Number(capacity).toFixed(2)}${messages.capacity_unit || 'AH'}`
    },

    formatPercent: state => (value) => {
      const messages = state.messages
      return `${Number(value).toFixed(2)}${messages.percent || '%'}`
    },

    // 连接状态
    isPasswordVerified: state => state.isPasswordVerified,

    // 电池百分比
    batteryPercentage: state => state.batteryPercentage,

    // 状态栏高度
    statusBarHeight: state => state.statusBarHeight,
    // 蓝牙设备信息
    batteryDevice: state => state.batteryDevice,
    bleManagerState: state => state.bleManager,
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
    bleManagerLocale: state => state.bleManager.locale
  }
})