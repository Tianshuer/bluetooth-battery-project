class BluetoothDataManager {
  constructor() {
    this.deviceId = null;
    this.serviceId = null;
    this.characteristicId = null;
    this.isConnected = false;
    this.discoveredPeripherals = []; // 已发现的设备列表

    // 添加参数读取状态
    this.parameterValues = new Map();
    this.versionName = '';

    this.dataCallbacks = new Set();
    this.statusCallbacks = new Set(); // 状态变化回调
    this.isListening = false; // 监听状态标记

    this.passwordResponse = {
      success: 'SUCCESS',
      failure: 'FAILURE'
    };
    this.fdCloseStatusText = '';
    this.cdCloseStatusText = '';
    this.batteryData = {
      // 状态相关
      chargingStatus: false,
      dischargingStatus: false,
      balancingStatus: false,

      // 电压相关
      totalVoltage: 0,
      voltageDiff: 0,
      lowestString: 0,  // 最低串 有一个电压差背景色要设置
      highestString: 0,  // 最高串  有一个电压差背景色要设置
      minVoltage: 0,
      maxVoltage: 0,
      averageVoltage: 0,

      // 电流和功率
      current: 0,
      power: 0,
      ratio: 0, // 无用

      // 容量相关
      capacity: 0,
      totalCapacity: 0,

      // 温度相关
      mosTemperature: 0,
      balanceTemperature: 0,
      chip1Temperature: 0,
      chip2Temperature: 0,

      // 均衡相关
      balanceStatus: [],

      // 数组数据
      voltages: [],        // 确保初始化为空数组
      temperatures: [],

      // 其他属性
      stringDrop: 0,
      dataQuality: 'normal',

      // 格式化显示字段
      // totalVoltageFormatted: '0.0000',
      // voltageDiffFormatted: '0.0000',
      // minVoltageFormatted: '0.0000',
      // maxVoltageFormatted: '0.0000',
      // currentFormatted: '0.0000',
      // powerFormatted: '0.0000',
      // averageVoltageFormatted: '0.0000',
      // mosTemperatureFormatted: '0.0',
      // balanceTemperatureFormatted: '0.0',
      // chip1TemperatureFormatted: '0.0',
      // chip2TemperatureFormatted: '0.0',
    }
  }

  // 设置设备信息
  setDeviceInfo(deviceId, serviceId, characteristicId) {
    this.deviceId = deviceId;
    this.serviceId = serviceId;
    this.characteristicId = characteristicId;
  }

  // 连接设备
  connectDevice(deviceId) {
    return new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId: deviceId,
        success: (res) => {
          this.deviceId = deviceId;
          this.isConnected = true;
          resolve(res);
        },
        fail: (err) => {
          console.error('连接设备失败:', err);
          this.isConnected = false;
          reject(err);
        }
      });
    });
  }

  // 获取设备的服务
  getDeviceServices(deviceId) {
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceServices({
        deviceId: deviceId,
        success: (res) => {
          resolve(res.services);
        },
        fail: (err) => {
          console.error('获取设备服务失败:', err);
          reject(err);
        }
      });
    });
  }

  // 获取设备的特征值
  getDeviceCharacteristics(deviceId, serviceId) {
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceCharacteristics({
        deviceId: deviceId,
        serviceId: serviceId,
        success: (res) => {
          resolve(res.characteristics);
        },
        fail: (err) => {
          console.error('获取设备特征值失败:', err);
          reject(err);
        }
      });
    });
  }

  // 启用通知
  enableNotify(deviceId, serviceId, characteristicId) {
    return new Promise((resolve, reject) => {
      uni.notifyBLECharacteristicValueChange({
        deviceId: deviceId,
        serviceId: serviceId,
        characteristicId: characteristicId,
        state: true, // 启用通知
        success: (res) => {
          console.log('启用通知成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('启用通知失败:', err);
          // 即使启用通知失败，也继续执行
          resolve();
        }
      });
    });
  }

  // 监听特征值变化
  onCharacteristicValueChange(callback) {
    this.dataCallbacks.add(callback);

    // 如果尚未建立监听，则初始化
    if (!this.isListening) {
      this.setupBLEListener();
    }

    return () => {
      this.dataCallbacks.delete(callback);
      if (this.dataCallbacks.size === 0) {
        this.cleanupBLEListener();
      }
    };
  }

  /**
   * 设置蓝牙监听
   */
  setupBLEListener() {
    if (this.isListening) return;

    console.log('初始化蓝牙特征值监听');
    uni.onBLECharacteristicValueChange(this.handleBLECharacteristicChange.bind(this));
    this.isListening = true;
  }

  /**
   * 处理蓝牙特征值变化
   * @param {Object} res - 回调结果
   */
  handleBLECharacteristicChange(res) {
    const data = this.parseBatteryData(res.value);
    // 执行所有注册的回调
    this.dataCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (e) {
        console.error('回调执行失败:', e);
      }
    });

  }

  cleanupBLEListener() {
    if (!this.isListening) return;

    console.log('清理蓝牙特征值监听');
    uni.offBLECharacteristicValueChange(this.handleBLECharacteristicChange);
    this.isListening = false;
  }

  // 解析电池数据
  parseBatteryData(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const rawString = String.fromCharCode.apply(null, uint8Array);
    // 检查原始字符串是否为空或无效
    if (!rawString || rawString.trim().length === 0) {
      console.warn('原始字符串为空或无效');
      return null;
    }
    const dataArray = this.parseDataArray(rawString);
    let newValues = {};
    
    for (const item of dataArray) {
      console.log("item", item);
      
      // 处理密码验证响应
      if (item === this.passwordResponse.success || item === this.passwordResponse.failure) {
        this.handlePasswordResponse(item);
        continue;
      } else if (item === 'RES') {
        uni.showToast({
          title: '已重启',
          icon: 'none'
        });
        continue;
      }
      
      // 处理状态命令
      if (item.includes('cdopen')) {
        this.updateStatus({ chargingStatus: true });
        console.log("检测到充电开启");
        this.clearCdDeviceStatus();
      } else if (item.includes("cdclose")) {
        this.updateStatus({ chargingStatus: false });
        console.log("检测到充电关闭");
        if (item.startsWith('cdclose') && item.length > 7) {
          this.handleCdCloseStatus(item);
        }
      } else if (item.includes("fdopen")) {
        this.updateStatus({ dischargingStatus: true });
        console.log("检测到放电开启");
        this.clearFdDeviceStatus();
      } else if (item.includes("fdclose")) {
        this.updateStatus({ dischargingStatus: false });
        console.log("检测到放电关闭");
        if (item.startsWith('fdclose') && item.length > 7) {
          this.handleFdCloseStatus(item);
        }
      } else if (item === 'jhstop') {
        this.updateStatus({ balancingStatus: false })
      } else if (item.startsWith("jhzt")) {
        const parsed = this.parseLine(item);
        if (parsed) {
          // this.updateStatus(parsed);
          this.updateBatteryDataOnMain(parsed.key, parsed.value);
        }
      } else {
        const parsed = this.parseLine(item);
        
        if (parsed) {
          this.updateBatteryDataOnMain(parsed.key, parsed.value);
        }
      }
      // 处理中间为:的内容（设置参数）
      const parts = item.split("=");
      if (parts.length == 2) {
        const keyOfEqual = parts[0].trim();
        const value = parts[1].trim();
        this.handleParameterSetting(keyOfEqual, value, newValues);
      }
    }
    // this.parameterValues = new Map(Object.entries(newValues));
    // console.log('parameterValues: ', Array.from(this.parameterValues.entries()));
    // console.log('处理后的电池数据:', this.batteryData);
    
    return this.batteryData;;
  }
  
  // 解析数据数组
  parseDataArray(rawString) {
    let lines = rawString.split("\n");
    console.log(lines);
    
    // 处理可能被截断的数据
    const processedLines = [];
    let currentLine = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
    
      if (line.length === 0) {
        continue; // 跳过空行
      }

      // 检查是否是完整的键值对
      if (line.includes(':')) {
        // 如果当前行有累积的内容，先处理
        if (currentLine.length > 0) {
          processedLines.push(currentLine);
          currentLine = '';
        }
        
        // 检查是否是完整的键值对
        const colonIndex = line.indexOf(':');
        if (colonIndex !== -1 && colonIndex < line.length - 1) {
          // 完整的键值对
          processedLines.push(line);
        } else {
          // 不完整的键值对，需要与下一行合并
          currentLine = line;
        }
      } else {
        // 没有冒号的行，可能是值的延续
        if (currentLine.length > 0) {
          // 合并到当前行
          currentLine += line;
          processedLines.push(currentLine);
          currentLine = '';
        } else {
          // 单独的行，可能是数值
          processedLines.push(line);
        }
      }
    }
    // 进一步处理可能被截断的数据
    const finalArray = [];
    for (let i = 0; i < processedLines.length; i++) {
      const line = processedLines[i];
      
      // 检查是否是键但没有值的情况
      if (line.endsWith(':')) {
        // 查找下一个非空行作为值
        let value = '';
        for (let j = i + 1; j < processedLines.length; j++) {
          const nextLine = processedLines[j].trim();
          if (nextLine.length > 0 && !nextLine.includes(':')) {
            value = nextLine;
            // 标记已使用
            processedLines[j] = '';
            break;
          }
        }
        finalArray.push(line + value);
      } else if (line.length > 0) {
        finalArray.push(line);
      }
    }
    
    return finalArray.filter(item => item.trim().length > 0);
  }

  // 处理密码响应
  handlePasswordResponse(response) {
    console.log('密码验证响应:', response);
    if (response === this.passwordResponse.success) {
      console.log('密码验证成功');
    } else {
      console.log('密码验证失败');
    }
  }

  // 更新状态显示
  updateStatus({ chargingStatus, dischargingStatus, balancingStatus }) {
    let hasChanges = false;
    
    if (chargingStatus !== undefined && chargingStatus !== null) {
      this.batteryData.chargingStatus = chargingStatus;
      hasChanges = true;
    }
    
    if (dischargingStatus !== undefined && dischargingStatus !== null) {
      this.batteryData.dischargingStatus = dischargingStatus;
      hasChanges = true;
    }
    
    if (balancingStatus !== undefined && balancingStatus !== null) {
      this.batteryData.balancingStatus = balancingStatus;
      hasChanges = true;
    }
    
    if (hasChanges) {
      // 更新数据
      // this.updateBatteryData();
      
      // 通知所有监听器
      this.notifyListeners();
    }
  }

  // 清除充电关闭状态
  clearCdDeviceStatus() {
    this.cdCloseStatusText = '';
    this.notifyListeners();
  }

  // 处理充电关闭状态
  handleCdCloseStatus(item) {
    console.log("检测到充电关闭", item);
  }

  // 处理放电关闭状态
  handleFdCloseStatus(item) {
    console.log("检测到放电关闭", item);
  }

  clearFdDeviceStatus() {
    this.fdCloseStatusText = '';
    this.notifyListeners();
  }

  // 解析数据行
  parseLine(item) {
    // 处理类似 "key:value" 格式的数据
    const colonIndex = item.indexOf(':');
    if (colonIndex !== -1) {
      const key = item.substring(0, colonIndex).trim();
      const value = item.substring(colonIndex + 1).trim();
      return { key, value };
    }

    // 处理类似 "key=value" 格式的数据
    const equalIndex = item.indexOf('=');
    if (equalIndex !== -1) {
      const key = item.substring(0, equalIndex).trim();
      const value = item.substring(equalIndex + 1).trim();
      return { key, value };
    }
    return null;
  }

  // 更新电池主数据
  updateBatteryDataOnMain(key, value) {
    this.updateBatteryData(key, value);
  }

  // 更新电池数据
  updateBatteryData(key, value) {
    switch (key) {
      case 'dc':
        this.batteryData.stringDrop = parseInt(value) || 0;
        break;
      case 'zdy':
        this.batteryData.totalVoltage = parseFloat(value) || 0.0;
        break;
      case 'yc':
        this.batteryData.voltageDiff = parseFloat(value) || 0.0;
        break;
      case 'zd':
        this.batteryData.lowestString = parseInt(value) || 0;
        break;
      case 'min':
        this.batteryData.minVoltage = parseFloat(value) || 0.0;
        break;
      case 'zg':
        this.batteryData.highestString = parseInt(value) || 0;  
        break;
      case 'max':
        this.batteryData.maxVoltage = parseFloat(value) || 0.0; 
        break;
      case 'dl':
        this.batteryData.current = parseFloat(value) || 0.0;
        break;
      case 'gl':
        this.batteryData.power = parseFloat(value) || 0.0;
        break;
      case 'bl':
        this.batteryData.ratio = parseFloat(value) || 0.0;
        break;
      case 'rl':
        this.batteryData.capacity = parseFloat(value) || 0.0;
        break;
      case 'zx':
        this.batteryData.totalCapacity = parseFloat(value) || 0.0;
        break;
      case 'pj':
        this.batteryData.averageVoltage = parseFloat(value) || 0.0;
        break;
      case 'moswd':
        this.batteryData.mosTemperature = parseFloat(value) || 0.0;
        break;
      case 'jhwd':
        this.batteryData.balanceTemperature = parseFloat(value) || 0.0;
        break;
      case 'xpwd1':
        this.batteryData.chip1Temperature = parseFloat(value) || 0.0;
        break;
      case 'xpwd2':
        this.batteryData.chip2Temperature = parseFloat(value) || 0.0;
        break;
      case 'jhzt':
        // 处理均衡状态数据
        this.updateStatus({ balancingStatus: true });

        // 尝试按照协议解析均衡状态数据
        if (value.length >= 4) {
          // 创建临时字节数组
          const balanceBytes = new Array(Math.min(value.length, this.batteryData.balanceStatus.length)).fill(0);
          
          // 解析每个字符作为一个字节
          for (let i = 0; i < Math.min(value.length, this.batteryData.balanceStatus.length); i++) {
            const charValue = value.charCodeAt(i);
            balanceBytes[i] = charValue;
          }
          
          // 更新均衡状态数组
          for (let i = 0; i < balanceBytes.length; i++) {
            if (i < this.batteryData.balanceStatus.length) {
              this.batteryData.balanceStatus[i] = balanceBytes[i];
            }
          }
        
          // 打印均衡中的电池串
          // const balancingStrings = this.getBalancingStrings();
          // console.log("均衡中的电池串:", balancingStrings);
          // 触发数据更新通知
          this.enableNotify(this.deviceId, this.serviceId, this.characteristicId);
          
          // 调试输出
          // const hexString = balanceBytes.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
          // console.log("均衡状态字节 (hex):", hexString);
          
          // 二进制表示，用于调试
          // const binaryString = balanceBytes.map(byte => {
          //   let binaryStr = '';
          //   for (let bit = 0; bit < 8; bit++) {
          //     binaryStr = ((byte & (1 << bit)) !== 0 ? '1' : '0') + binaryStr;
          //   }
          //   return binaryStr;
          // }).join(' ');
          // console.log("均衡状态二进制:", binaryString);
        }
        break;
      default:
        // 处理温度数据 u1-u4
        if (key.startsWith('u')) {
          const index = parseInt(key.substring(1));
          const temp = parseFloat(value) || 0.0;
          if (!isNaN(index) && !isNaN(temp)) {
            // 确保数组长度足够
            while (this.batteryData.temperatures.length < index) {
              this.batteryData.temperatures.push(0);
            }
            this.batteryData.temperatures[index - 1] = temp;
          }
        } else if (!isNaN(parseInt(key))) {
          // console.warn('key: ', key, 'value: ', value);
          
          // 处理电池电压数据 1-30
          const index = parseInt(key);
          const voltage = parseFloat(value) || 0.0;
          if (!isNaN(index) && !isNaN(voltage)) {
            // 确保数组长度足够
            while (this.batteryData.voltages.length < index) {
              this.batteryData.voltages.push(0);
            }
            this.batteryData.voltages[index - 1] = voltage;
            
            // 触发数据更新通知
            // this.enableNotify(this.deviceId, this.serviceId, this.characteristicId);
          }
        } else {
          // 未知参数，按字符串存储
          console.warn(`未知参数类型: ${key} = ${value}`);
        }
        break;
    }
    // 这里可以添加数据更新逻辑
    // console.log("=== 电池数据更新完成 ===");
    // console.log("电池数据已更新: ", this.batteryData);
  }

  // 通知监听器
  notifyListeners() {
    // 通知状态回调
    this.statusCallbacks.forEach((callback, index) => {
      try {
        callback(this.batteryData);
    } catch (error) {
        console.error(`状态回调函数 ${index} 执行失败:`, error);
    }
    });

    // 通知数据回调
    this.dataCallbacks.forEach((callback, index) => {
    try {
        callback(this.batteryData);
    } catch (error) {
        console.error(`数据回调函数 ${index} 执行失败:`, error);
    }
    });
  }
   
  // 处理参数设置
  handleParameterSetting(key, value, newValues) {
    switch (key) {
      case 'CS':
        newValues["串数设置"] = value;
        this.batteryData.totalStrings = Math.max(0, Math.min(252, parseInt(value) || 0));
        console.log(`Updated CS value: ${value}, displayed strings: ${this.batteryData.totalStrings}`);
        break;
      case "gybh":
        newValues["gybh"] = value;
        break;
      case "gyhf":
        newValues["gyhf"] = value;
        break;
      case "qyhf":
        newValues["qyhf"] = value;
        break;
      case "qybh":
        newValues["qybh"] = value;
        break;
      case "usergw":
        newValues["usergw"] = value;
        break;
      case "userhf":
        newValues["userhf"] = value;
        break;
      case "mosgw":
        newValues["mosgw"] = value;
        break;
      case "moshf":
        newValues["moshf"] = value;
        break;
      case "jhyc":
        newValues["jhyc"] = value;
        break;
      case "jhwd":
        newValues["jhwd"] = value;
        break;
      case "dcrl":
        newValues["dcrl"] = value;
        break;
      case "ycjh":
        newValues["ycjh"] = value;
        break;
      case "jhqd":
        newValues["jhqd"] = value;
        break;
      case "gzys":
        newValues["gzys"] = value;
        break;
      case "glbh":
        newValues["glbh"] = value;
        break;
      case "cdgl":
        newValues["cdgl"] = value;
        break;
      case "ycbh":
        newValues["ycbh"] = value;
        this.batteryData.ycbh = parseFloat(value) || 0;
        break;
      case "ver":
        newValues["ver"] = value;
        this.versionName = value;
        break;
      case "dljd":
        newValues["dljd"] = value;
        break;
      case "dlxd":
        newValues["dlxd"] = value;
        break;
      case "dlys":
        newValues["dlys"] = value;
        break;
      case "jhpl":
        newValues["jhpl"] = value;
        break;
      default:
        // newValues[key] = value;
        console.warn(`未知参数: ${key}`);
        break;
    }
    console.log('newValues: ', newValues);
    
    // 更新视图显示
    // this.batteryData[key] = newValues.get(key);
  }

  // 断开连接
  disconnect() {
    if (this.deviceId) {
      uni.closeBLEConnection({
        deviceId: this.deviceId,
        success: (res) => {
          console.log('断开连接成功:', res);
        },
        fail: (err) => {
          console.error('断开连接失败:', err);
        }
      });
    }
    this.isConnected = false;
    this.deviceId = null;
    this.serviceId = null;
    this.characteristicId = null;
  }

  // 清理资源
  destroy() {
    this.disconnect();
    this.dataCallbacks = [];
    uni.offBLECharacteristicValueChange();
  }
}

export default new BluetoothDataManager(); 