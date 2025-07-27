// 全局状态管理 - 使用Vue响应式系统
import Vue from 'vue'

// 使用Vue.observable()使状态变成响应式
const globalState = Vue.observable({
  // 语言设置
  currentLanguageIndex: 0,
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
  ]
})

// 状态管理对象
export default {
  // 获取当前语言
  getCurrentLanguage() {
    return globalState.languageOptions[globalState.currentLanguageIndex]
  },
  
  // 获取语言选项
  getLanguageOptions() {
    return globalState.languageOptions
  },
  
  // 获取当前语言索引
  getCurrentLanguageIndex() {
    return globalState.currentLanguageIndex
  },
  
  // 切换语言
  setLanguage(index) {
    globalState.currentLanguageIndex = index
    const currentLang = this.getCurrentLanguage()
    
    // 保存到本地存储
    uni.setStorageSync('selectedLanguage', index)
    
    // 显示提示
    uni.showToast({
      title: `语言切换为: ${currentLang.shortText}`,
      icon: 'success',
      duration: 1500
    })
  },
  
  // 获取响应式状态对象（供组件直接使用）
  getState() {
    return globalState
  },
  
  // 初始化
  init() {
    // 从本地存储读取语言设置
    const savedLanguage = uni.getStorageSync('selectedLanguage')
    if (savedLanguage !== '' && savedLanguage !== undefined) {
      globalState.currentLanguageIndex = savedLanguage
    }
  }
} 