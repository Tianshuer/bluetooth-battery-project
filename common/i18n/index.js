// 国际化管理器
import zh from './zh.js'
import en from './en.js'

// 语言包映射
const languagePacks = {
  'zh': zh,
  'en': en
}

// 当前语言
let currentLanguage = 'zh'

// 国际化管理器
export default {
  // 设置当前语言
  setLanguage(lang) {
    if (languagePacks[lang]) {
      currentLanguage = lang
      // 保存到本地存储
      uni.setStorageSync('currentLanguage', lang)
      return true
    }
    return false
  },

  // 获取当前语言
  getCurrentLanguage() {
    return currentLanguage
  },

  // 获取文本
  t(key, ...args) {
    const langPack = languagePacks[currentLanguage]
    if (!langPack) {
      console.warn(`Language pack not found: ${currentLanguage}`)
      return key
    }

    let text = langPack[key]
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

  // 获取所有可用语言
  getAvailableLanguages() {
    return Object.keys(languagePacks)
  },

  // 获取语言包
  getLanguagePack(lang) {
    return languagePacks[lang] || {}
  },

  // 初始化语言设置
  init() {
    // 从本地存储读取语言设置
    const savedLanguage = uni.getStorageSync('currentLanguage')
    if (savedLanguage && languagePacks[savedLanguage]) {
      currentLanguage = savedLanguage
    } else {
      // 默认使用中文
      currentLanguage = 'zh'
      uni.setStorageSync('currentLanguage', 'zh')
    }
  },

  // 格式化数字
  formatNumber(number, decimals = 2) {
    return Number(number).toFixed(decimals)
  },

  // 格式化电压
  formatVoltage(voltage) {
    return `${this.formatNumber(voltage)}${this.t('voltage_unit')}`
  },

  // 格式化电流
  formatCurrent(current) {
    return `${this.formatNumber(current)}${this.t('current_unit')}`
  },

  // 格式化功率
  formatPower(power) {
    return `${this.formatNumber(power)}${this.t('power_unit')}`
  },

  // 格式化温度
  formatTemperature(temp) {
    return `${this.formatNumber(temp)}${this.t('temperature_unit')}`
  },

  // 格式化容量
  formatCapacity(capacity) {
    return `${this.formatNumber(capacity)}${this.t('capacity_unit')}`
  },

  // 格式化百分比
  formatPercent(value) {
    return `${this.formatNumber(value)}${this.t('percent')}`
  }
}

// 导出语言包供直接使用
export { zh, en } 