import i18n from '@/common/i18n/index.js';
const t = i18n.t;

class AppConstants {
  // 参数命令映射
  static get parameterCommandMap() {
    return {
      "series_number_setting": "CS",
      "over_voltage_protection": "gybh",
      "over_voltage_recovery": "gyhf",
      "under_voltage_recovery": "qyhf",
      "under_voltage_protection": "qybh",
      "probe_high_temp": "usergw",
      "probe_recovery_temp": "userhf",
      "mos_high_temp": "mosgw",
      "mos_recovery_temp": "moshf",
      "balance_voltage_diff": "jhyc",
      "balance_temperature": "jhwd",
      "battery_capacity": "dcrl",
      "voltage_diff_balance": "ycjh",
      "balance_start": "jhqd",
      "current_limit": "dljd",
      "fault_delay": "gzys",
      "over_current_protection": "glbh",
      "charging_over_current": "cdgl",
      "voltage_diff_protection": "ycbh",
      "current_limit_debounce": "dlxd",
      "short_circuit_delay": "dlys",
      "balance_frequency": "jhpl",
      "rename_device": "",
    };
  }

  // 参数命令前缀映射
  static get parameterCommandPrefixMap() {
    return {
      "series_number_setting": "CS",  // 串数设置
      "over_voltage_protection": "gybh",  // 过压保护
      "over_voltage_recovery": "gyhf",   // 过压恢复
      "under_voltage_recovery": "qyhf",  // 欠压恢复
      "under_voltage_protection": "qybh",  // 欠压保护
      "probe_high_temp": "usgw",  // 探头高温
      "probe_recovery_temp": "ushf",  // 探头恢复
      "mos_high_temp": "msgw",  // MOS高温
      "mos_recovery_temp": "mshf", // MOS恢复
      "balance_voltage_diff": "jhyc",  // 均衡压差
      "balance_temperature": "jhwd",  // 均衡温度
      "battery_capacity": "dcrl",  // 电池容量
      "voltage_diff_balance": "ycjh",  // 压差均衡
      "balance_start": "jhqd",   // 均衡启动
      "fault_delay": "gzys",  // 故障延时
      "current_limit": "dqdl",  // 当前电流
      "over_current_protection": "glbh",  // 过流保护
      "charging_over_current": "cdgl",   // 充电过流
      "voltage_diff_protection": "ycbh",  // 压差保护
      "current_limit_debounce": "dlxd",  // 电流消抖
      "short_circuit_delay": "gyys",  // 短路延时
      "balance_frequency": "jhpl",  // 均衡频率
      "rename_device": "",
    };
  }

  // 参数单位映射
  static get parameterUnitMap() {
    return {
      "series_number_setting": "S",
      "over_voltage_protection": "V",
      "over_voltage_recovery": "V",
      "under_voltage_protection": "V",
      "under_voltage_recovery": "V",
      "probe_high_temp": "℃",
      "probe_recovery_temp": "℃",
      "mos_high_temp": "℃",
      "mos_recovery_temp": "℃",
      "balance_voltage_diff": "V",
      "balance_temperature": "℃",
      "balance_frequency": "ms",
      "battery_capacity": "Ah",
      "voltage_diff_balance": "V",
      "balance_start": "V",
      "current_limit": "A",
      "fault_delay": "s",
      "over_current_protection": "A",
      "charging_over_current": "A",
      "voltage_diff_protection": "V",
      "current_limit_debounce": "A",
      "short_circuit_delay": "us",
      "rename_device": "",
    };
  }

  /**
   * 设置命令映射
   * @param {string} commandValue - 命令值
   * @param {Map} newMap - 新映射
   * @param {string} newValue - 新值
   * @returns {Map} 新的Map对象
   */
  static setCommandMap(commandValue, newMap, newValue) {
    // 如果没有找到匹配的值
    const key = this.getKeyFromCommandMap(commandValue);
    if (key !== null) {
      // 创建新的Map副本，避免修改原始Map
      const resultMap = new Map(newMap);
      resultMap.set(key, newValue);
      return resultMap;
    }
    // 如果没有找到匹配的命令，返回原始Map的副本
    return new Map(newMap);
  }

  /**
   * 从命令映射中获取键
   * @param {string} value - 值
   * @returns {string|null} 键或null
   */
  static getKeyFromCommandMap(value) {
    for (const [key, val] of Object.entries(this.parameterCommandMap)) {
      if (val === value) {
        return key;
      }
    }
    return null; // 如果没有找到匹配的值
  }

  /**
   * 从单位映射中获取单位
   * @param {string} key - 键
   * @returns {string|null} 单位或null
   */
  static getUnitFromUnitMap(key) {
    return this.parameterUnitMap[key] || null;
  }

  /**
   * 根据国际化键获取本地化字符串
   * @param {string} i18nKey - 国际化键
   * @returns {string} 本地化字符串
   */
  static getLocalizedParameterTitle(i18nKey) {
    try {
      // 使用i18n实例获取本地化字符串
      return i18n.t(i18nKey) || i18nKey;
    } catch (error) {
      console.warn(`获取本地化字符串失败: ${i18nKey}`, error);
      return i18nKey; // 如果找不到，返回原始键作为备用
    }
  }
}

export default AppConstants;