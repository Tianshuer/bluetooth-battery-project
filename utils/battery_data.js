class BatteryData {
  constructor() {
    // 电压相关数据
    this.totalVoltage = 0.0;
    this.voltageDiff = 0.0;
    this.ycbh = 0.0; // 压差保护

    // 电池串数相关
    this.lowestString = 0;
    this.minVoltage = 0.0;
    this.highestString = 0;
    this.maxVoltage = 0.0;

    // 电流和容量相关
    this.current = 0.0;
    this.ratio = 0.0;
    this.capacity = 0.0;
    this.totalCapacity = 0.0;
    this.cycleCapacity = 0.0;
    this.averageVoltage = 0.0;

    // 功率
    this.power = 0.0;

    // 温度数据
    this.mosTemperature = 0.0;
    this.balanceTemperature = 0.0;
    this.temperatures = [0.0, 0.0, 0.0, 0.0];
    this.chip1Temperature = 0.0;
    this.chip2Temperature = 0.0;

    // 温度数据
    this.mosTemperature = 0.0;
    this.balanceTemperature = 0.0;
    this.temperatures = [0.0, 0.0, 0.0, 0.0];
    this.chip1Temperature = 0.0;
    this.chip2Temperature = 0.0;

    // 故障延迟倒计时
    this.gzys = 0;

    // 状态数据
    this.voltages = new Array(252).fill(0.0);
    this.chargingStatus = false;
    this.dischargingStatus = false;
    this.balancingStatus = false;

    // 均衡状态 (42 bytes for 252 strings: 42 * 6 = 252)
    this.balanceStatus = new Array(42).fill(0);
    this.totalStrings = 252; // 默认252串
  }
  update() {
    // 在 JavaScript 中，如果需要通知功能，可以使用事件发射器
    // 或者通过回调函数实现
    if (this.onUpdate) {
      this.onUpdate(this);
    }
  }

  // 设置更新回调
  setUpdateCallback(callback) {
    this.onUpdate = callback;
  }

  // 检查是否显示压差保护警告
  showYCBHAlert() {
    let showAlert = false;
    if (this.voltageDiff > 0.0 && this.ycbh > 0.0 && this.voltageDiff > this.ycbh) {
      showAlert = true;
    }
    return showAlert;
  }

  // 获取均衡中的电池串
  getBalancingStrings() {
    let balancingStrings = [];

    // 遍历均衡状态字节数组
    for (let byteIndex = 0; byteIndex < this.balanceStatus.length; byteIndex++) {
      let byte = this.balanceStatus[byteIndex];

      // 检查每个字节的8位
      for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
        if ((byte >> bitIndex) & 1 === 1) { // 检查位是否被设置
          // 计算串索引 (根据你的 Swift 逻辑调整)
          let stringIndex = (byteIndex * 8) + (bitIndex + 1);

          // 假设最大24串，根据需要过滤
          if (stringIndex <= 24) {
            balancingStrings.push(stringIndex);
          }
        }
      }
    }

    return balancingStrings;
  }

  // 更新单个属性
  updateProperty(key, value) {
    if (this.hasOwnProperty(key)) {
      this[key] = value;
      this.update();
    }
  }

  // 批量更新属性
  updateMultiple(updates) {
    for (const [key, value] of Object.entries(updates)) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    }
    this.update();
  }

  // 重置所有数据
  reset() {
    this.totalVoltage = 0.0;
    this.voltageDiff = 0.0;
    this.ycbh = 0.0;
    this.lowestString = 0;
    this.minVoltage = 0.0;
    this.highestString = 0;
    this.maxVoltage = 0.0;
    this.current = 0.0;
    this.ratio = 0.0;
    this.capacity = 0.0;
    this.totalCapacity = 0.0;
    this.cycleCapacity = 0.0;
    this.averageVoltage = 0.0;
    this.power = 0.0;
    this.mosTemperature = 0.0;
    this.balanceTemperature = 0.0;
    this.temperatures = [0.0, 0.0, 0.0, 0.0];
    this.chip1Temperature = 0.0;
    this.chip2Temperature = 0.0;
    this.gzys = 0;
    this.voltages = new Array(252).fill(0.0);
    this.chargingStatus = false;
    this.dischargingStatus = false;
    this.balancingStatus = false;
    this.balanceStatus = new Array(42).fill(0);
    this.totalStrings = 252;
  }

  // 获取数据快照
  getSnapshot() {
    return {
      totalVoltage: this.totalVoltage,
      voltageDiff: this.voltageDiff,
      ycbh: this.ycbh,
      lowestString: this.lowestString,
      minVoltage: this.minVoltage,
      highestString: this.highestString,
      maxVoltage: this.maxVoltage,
      current: this.current,
      ratio: this.ratio,
      capacity: this.capacity,
      totalCapacity: this.totalCapacity,
      cycleCapacity: this.cycleCapacity,
      averageVoltage: this.averageVoltage,
      power: this.power,
      mosTemperature: this.mosTemperature,
      balanceTemperature: this.balanceTemperature,
      temperatures: [...this.temperatures],
      chip1Temperature: this.chip1Temperature,
      chip2Temperature: this.chip2Temperature,
      gzys: this.gzys,
      voltages: [...this.voltages],
      chargingStatus: this.chargingStatus,
      dischargingStatus: this.dischargingStatus,
      balancingStatus: this.balancingStatus,
      balanceStatus: [...this.balanceStatus],
      totalStrings: this.totalStrings
    };
  }

  // 从快照恢复数据
  restoreFromSnapshot(snapshot) {
    for (const [key, value] of Object.entries(snapshot)) {
      if (this.hasOwnProperty(key)) {
        this[key] = value;
      }
    }
  }
}

export default BatteryData;