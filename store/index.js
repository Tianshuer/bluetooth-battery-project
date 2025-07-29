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
    languageOptions: [
      {
        icon: '🇨🇳',
        iconUrl: '/static/china.png',
        text: '🇨🇳 中文',
        shortText: '中文',
        value: 'zh'
      },
      {
        icon: '🇺🇸', 
        iconUrl: '/static/united-states-of-america.png',
        text: '🇺🇸 English',
        shortText: 'English',
        value: 'en'
      }
    ],
    // 连接状态
    isConnected: true,
    // 密码验证状态
    isPasswordVerified: false,
    // 语言变化触发器
    languageChangeTrigger: 0,
    // 电池百分比
    batteryPercentage: 85
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
    }
  },
  
  actions: {
    // 切换语言
    switchLanguage({ commit }, language) {
      commit('SET_LANGUAGE', language)
    },
    
    // 设置连接状态
    setConnectionStatus({ commit }, status) {
      commit('SET_CONNECTION_STATUS', status)
    },
    
    // 设置密码验证状态
    setPasswordVerified({ commit }, status) {
      commit('SET_PASSWORD_VERIFIED', status)
    },
    
    // 初始化语言设置
    initLanguage({ commit }) {
      const savedLanguage = uni.getStorageSync('currentLanguage')
      if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
        commit('SET_LANGUAGE', savedLanguage)
      } else {
        commit('SET_LANGUAGE', 'zh')
      }
    },
    
    // 设置电池百分比
    setBatteryPercentage({ commit }, percentage) {
      commit('SET_BATTERY_PERCENTAGE', percentage)
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
      
      if (!text) {
        console.warn(`Translation key not found: ${key}`)
        return key
      }
      
      // 处理参数替换
      if (args.length > 0) {
        args.forEach((arg, index) => {
          text = text.replace(`%d`, arg)
          text = text.replace(`%@`, arg)
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
    isConnected: state => state.isConnected,
    isPasswordVerified: state => state.isPasswordVerified,
    
    // 电池百分比
    batteryPercentage: state => state.batteryPercentage
  }
}) 