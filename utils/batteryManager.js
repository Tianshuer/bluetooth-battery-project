import ProductConfig from './productConfig';
import AppConstants from './app_constants.js';
import BatteryData from './battery_data.js';
import i18n from '@/common/i18n/index.js';
import {
  Command,
  CommandType,
  PasswordResponse,
} from './common_enum.js';

class WriteTask {
  constructor(characteristic, data) {
    this.characteristic = characteristic;
    this.data = data;
    this.completer = {};
    this.completer.promise = new Promise((resolve, reject) => {
      this.completer.resolve = resolve;
      this.completer.reject = reject;
    });
  }
  complete(result) {
    this.completer.resolve(result);
  }
  completeError(error) {
    this.completer.reject(error);
  }
  get promise() {
    return this.completer.promise;
  }
  static createIfNull(characteristic, data, existingTask = null) {
    return existingTask || new WriteTask(characteristic, data);
  }
}

const WritePriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high' // 用于心跳包或关键命令
};

class BluetoothWriter {
  constructor() {
    // 写入特征值（可选，可以稍后设置）
    this._writeCharacteristic = null;
    // 允许为心跳包使用独立的特征值（如果需要的话），否则使用主特征值
    this._heartbeatCharacteristic = null;

    // 写入任务队列
    this._writeQueue = [];

    // 心跳相关
    this._heartbeatTimer = null;
    this._heartbeatData = null;
    this._heartbeatInterval = 5000; // 默认心跳间隔5秒

    // 防止多个并发处理循环的标志
    this._isProcessingQueue = false;
  }
  /**
   * 设置要写入的特征值
   * @param {Object} characteristic - 蓝牙特征值对象
   */
  setCharacteristic(characteristic) {
    this._writeCharacteristic = characteristic;

    // 如果特征值改变，可能需要清空队列
    // 或处理重连场景
    this._writeQueue = [];
    this._stopHeartbeat(); // 如果特征值改变，停止旧的心跳
  }

  /**
   * 设置心跳数据并启动心跳定时器
   * @param {Uint8Array|null} data - 心跳数据，如果为null则停止心跳
   * @param {number} interval - 心跳间隔（毫秒），默认5000ms
   */
  async setHeartbeat(data = null, interval = 5000) {
    this._stopHeartbeat(); // 停止任何现有的定时器
    this._heartbeatData = data;
    this._heartbeatInterval = interval;

    if (this._heartbeatData !== null) {
      await this._startHeartbeat();
    }
  }

  /**
   * 启动心跳定时器
   */
  _startHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
    }

    this._heartbeatTimer = setInterval(async () => {
      if (this._heartbeatData !== null && this._writeCharacteristic !== null) {
        console.log('发送心跳包');

        // 使用心跳特征值（如果设置了），否则使用写入特征值
        const characteristicToUse = this._heartbeatCharacteristic || this._writeCharacteristic;

        await this._enqueueWrite(
          characteristicToUse,
          this._heartbeatData,
          null,
          WritePriority.HIGH
        );
      }
    }, this._heartbeatInterval);

    console.log(`心跳包启动，间隔: ${this._heartbeatInterval}ms`);
  }
  /**
   * 停止心跳定时器
   */
  _stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
      console.log('心跳包停止');
    }
  }

  /**
   * 将写入操作加入队列。写入成功返回true，失败返回false。
   * @param {Object} options - 选项对象
   * @param {Uint8Array} options.data - 要写入的数据
   * @param {string} options.priority - 优先级，默认为normal
   * @returns {promise<boolean>} 写入结果
   */
  async writeData({
    data,
    priority = WritePriority.NORMAL,
  } = {}) {
    try {
      // 检查写入特征值是否已设置
      if (!this._writeCharacteristic) {
        console.error('特征值未设置');
        return false;
      }
  
      // 创建写入任务
      const task = new WriteTask(this._writeCharacteristic, data);

      // 将任务加入队列
      await this._enqueueWrite(
        this._writeCharacteristic,
        data,
        task,
        priority,
      );
      // 等待任务完成并返回结果
      const result = await task.promise;
      return result;
    } catch (error) {
      console.error('写入数据失败:', error);
      return false;
    }
  }

  /**
   * 设置心跳专用特征值
   * @param {Object} characteristic - 心跳专用的蓝牙特征值
   */
  setHeartbeatCharacteristic(characteristic) {
    this._heartbeatCharacteristic = characteristic;
    console.log('心跳特征值已设置');
  }
  /**
   * 将写入任务加入队列
   * @param {Object} characteristic - 蓝牙特征值
   * @param {Uint8Array} data - 要写入的数据
   * @param {Object} options - 选项对象
   * @param {WriteTask} options.task - 可选的写入任务
   * @param {string} options.priority - 优先级，默认为normal
   */
  async _enqueueWrite(
    characteristic,
    data,
    task = null,
    priority = WritePriority.NORMAL,
  ) {
    if (!task) {
      task = WriteTask.createIfNull(characteristic, data, task);
    }
    
    let isSameData = false;
    if (this._writeQueue.length > 0) {
      const firstTask = this._writeQueue[0];
      if (firstTask && firstTask.data) {
        isSameData = this._isSameData(firstTask.data, data);
      }
    }
    if (priority === WritePriority.HIGH &&
      this._writeQueue.length > 0 &&
      isSameData) {
      // 如果队列前端已经是这个心跳包，不要添加另一个
      // console.log("心跳包已在队列中，跳过入队。");
      task.complete(true); // 视为成功，因为它很快就会被发送
      return;
    }

    if (priority === WritePriority.HIGH) {
      this._writeQueue.unshift(task); // 高优先级插入前端
      console.log(`入队高优先级写入（队列中${this._writeQueue.length}个）: ${this._arrayBufferToHex(data)}`);
    } else {
      this._writeQueue.push(task); // 普通优先级添加到末尾
      console.log(`入队普通优先级写入（队列中${this._writeQueue.length}个）: ${this._arrayBufferToHex(data)}`);
    }
    await this._processQueue();
  }
  /**
   * 按顺序处理写入队列
   */
  async _processQueue() {
    // 已经在处理中，直接返回。现有的循环会处理新任务。
    if (this._isProcessingQueue) return;

    this._isProcessingQueue = true;
    console.log("开始队列处理...", this._writeQueue);

    while (this._writeQueue.length > 0) {
      const task = this._writeQueue.shift();
      let success = false;

      try {
        console.log(
          `尝试写入数据: ${this._arrayBufferToHex(task.data)} 到 ${task.characteristic.characteristicId}`
        );

        // 根据您的协议使用超时和withoutResponse。
        // 对于一般命令，withoutResponse: false 对于成功确认更安全。
        success = await this._writeBLECharacteristicValue(task.data);
        console.log(`_processQueue写入成功: ${this._arrayBufferToHex(task.data)}`);
      } catch (error) {
        console.log(`_processQueue写入失败 ${this._arrayBufferToHex(task.data)}: ${error}`);
        success = false;
        // 可选择：失败时重新入队或记录更多详细信息
      } finally {
        task.complete(success); // 向调用者报告结果
      }

      // 添加小延迟防止过载BLE模块
      // 这对稳定性至关重要，特别是频繁写入时。
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this._isProcessingQueue = false;
    console.log("队列处理完成。");
  }

  /**
   * 实际执行蓝牙写入操作
   * @param {Uint8Array} data - 要写入的数据
   * @returns {Promise} 写入结果
   */
  async _writeBLECharacteristicValue(data) {
    const characteristic = this._writeCharacteristic;
    let writeData;
    if (data instanceof ArrayBuffer) {
      writeData = data;
    } else if (data instanceof Uint8Array) {
      writeData = data.buffer;
    } else if (data.buffer instanceof ArrayBuffer) {
      writeData = data.buffer;
    } else if (Array.isArray(data)) {
      writeData = new Uint8Array(data).buffer;
    } else {
      throw new Error(`不支持的数据类型: ${typeof data}`);
    }
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('蓝牙写入超时'));
      }, 5000); 
      uni.writeBLECharacteristicValue({
        deviceId: characteristic.deviceId,
        serviceId: characteristic.serviceId,
        characteristicId: characteristic.characteristicId,
        value: writeData,
        writeType: 'writeNoResponse',
        success: (res) => {
          console.log(`BLE写入成功: ${this._arrayBufferToHex(writeData)}`);
          resolve(true);
        },
        fail: (err) => {
          clearTimeout(timeoutId); // 清除超时
          console.error('BLE写入失败:', err);
          reject(false);
        }
      });
    });
  }

  /**
   * 比较两个数据是否相同
   * @param {Object} data1 - 第一个数据
   * @param {Uint8Array} data2 - 第二个数据
   * @returns {boolean} 是否相同
   */
  _isSameData(data1, data2) {
    // 情况1：如果data1是Uint8Array/Buffer，直接比较二进制
  if (data1 instanceof Uint8Array || ArrayBuffer.isView(data1)) {
    if (data1.length !== data2.length) return false;
      const view1 = new DataView(data1.buffer);
      const view2 = new DataView(data2.buffer);
      for (let i = 0; i < data1.byteLength; i++) {
        if (view1.getUint8(i) !== view2.getUint8(i)) return false;
      }
      return true;
    }
  
    // 情况2：如果data1是普通对象，转换为JSON字符串再转为Buffer比较
    try {
      const str = JSON.stringify(data1);
      const buf1 = new TextEncoder().encode(str);
      
      if (buf1.length !== data2.length) return false;
      const view1 = new DataView(buf1.buffer);
      const view2 = new DataView(data2.buffer);
      for (let i = 0; i < buf1.byteLength; i++) {
        if (view1.getUint8(i) !== view2.getUint8(i)) return false;
      }
      return true;
    } catch {
      return false; // JSON.stringify失败时视为不相同
    }
  }
  /**
   * 清理队列并停止心跳
   * 释放所有资源，将待处理任务标记为失败
   */
  dispose() {
    try {
      // 停止心跳定时器
      this._stopHeartbeat();

      // 将所有待处理任务标记为失败
      const pendingTasks = this._writeQueue.length;
      this._writeQueue.forEach((task, index) => {
        try {
          task.complete(false); // 将待处理任务标记为失败
          console.log(`写入失败: ${this._arrayBufferToHex(task.data)}`);
        } catch (error) {
          console.warn(`清理任务 ${index} 时出错:`, error);
        }
      });
      if (pendingTasks > 0) {
        console.log(`已清理 ${pendingTasks} 个待处理任务`);
      }

      // 清空写入队列
      this._writeQueue = [];

      // 重置处理状态
      this._isProcessingQueue = false;

      // 清空特征值引用
      this._writeCharacteristic = null;
      this._heartbeatCharacteristic = null;

      // 清空心跳数据
      this._heartbeatData = null;

      console.log("BluetoothWriter已释放。");
    } catch (error) {
      console.error("释放BluetoothWriter时出错:", error);
    }
  }
    /**
   * 将ArrayBuffer转换为十六进制字符串用于日志
   * @param {Uint8Array} data - 要转换的数据
   * @returns {string} 十六进制字符串
   */
  _arrayBufferToHex(data) {
    try {
      return Array.from(data)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
    } catch (error) {
      console.error("ArrayBuffer转十六进制失败:", error);
      return '';
    }
  }
}

class BLEManager {
  constructor(preLocale = 'en') {
    this.t = i18n.t.bind(i18n);

    // 国际化设置
    this._locale = preLocale; // 默认设置为英文

    // 事件监听器数组（替代Flutter的ChangeNotifier）
    this._listeners = [];

    // MARK: - 发布属性
    this._isConnected = false;
    this._batteryData = new BatteryData();
    this._discoveredPeripherals = []; // 发现的设备列表

    // 参数读取状态
    this._parameterValues = new Map(); // 使用Map替代Dart的Map
    this._versionName = "";

    // MARK: - 私有属性
    this._peripheral = null; // 当前连接的设备
    this._writeCharacteristic = null; // 用于向设备发送数据
    this._notifyCharacteristic = null; // 用于接收设备数据

    // --- 开始：添加BluetoothWriter实例 ---
    this._bluetoothWriter = new BluetoothWriter();
    // --- 结束：添加BluetoothWriter实例 ---

    // 目标设备ID和名称
    this._deviceId = "FF:21:12:22:20:ED"; // 设备ID占位符
    this._deviceName = "";

    // 密码相关状态
    this._passwordVerified = false;
    this._firstPasswordVerified = false;
    this._lastError = null;
    this._passwordTimer = null;
    this.verifiedPassword = null; // 最近一次验证通过的密码
    this.lastVerifyPassword = ''; // 记录本次待验证的密码

    // 故障延时定时器
    this.gzysTimer = null;

    this._isConnectionEnabled = true;
    this._cdCloseStatusText = '';
    this._fdCloseStatusText = '';

    // MARK: - 数据接收缓冲区
    this._receiveBuffer = ""; // 接收数据缓冲区
    this._processingTimer = null; // 数据处理定时器
    this._isScanning = false; // 扫描状态标志

    // 蓝牙事件订阅管理
    this.bleSubscription = null;
    this._subscriptions = new Set(); // 管理多个订阅

    // 初始化蓝牙状态监听器
    this._initializeBluetoothStateListener();
    
    // 初始化时同步一次状态到Vuex
    this._syncStateToVuex();
  }
  // MARK: - 常量定义
  static get SERVICE_UUID() {
    return "0000FFF0-0000-1000-8000-00805F9B34FB";
  }

  static get NOTIFY_CHARACTERISTIC_UUID() {
    return "0000FFF2-0000-1000-8000-00805F9B34FB"; // 通知特征
  }

  static get WRITE_CHARACTERISTIC_UUID() {
    return "0000FFF1-0000-1000-8000-00805F9B34FB"; // 写特征
  }

  // 目标设备名称前缀 - 在ProductConfig中配置
  get _targetDevicePrefix() {
    return ProductConfig.devicePrefix || "BLE_DEVICE";
  }

  // MARK: - Getter方法
  get isConnected() {
    return this._isConnected;
  }

  get isScanning() {
    return this._isScanning;
  }
  get batteryData() {
    return this._batteryData;
  }

  get discoveredPeripherals() {
    return this._discoveredPeripherals; // 返回实时数据
  }

  get parameterValues() {
    return new Map(this._parameterValues); // 返回副本
  }

  get passwordVerified() {
    return this._passwordVerified;
  }

  get deviceId() {
    return this._deviceId;
  }

  get deviceName() {
    return this._deviceName;
  }

  get lastError() {
    return this._lastError;
  }

  get isConnectionEnabled() {
    return this._isConnectionEnabled;
  }

  get cdCloseStatusText() {
    return this._cdCloseStatusText;
  }

  get fdCloseStatusText() {
    return this._fdCloseStatusText;
  }

  get notifyCharacteristic() {
    return this._notifyCharacteristic;
  }

  get writeCharacteristic() {
    return this._writeCharacteristic;
  }

  // // MARK: - Setter方法
  // set isConnected(value) {
  //   if (this._isConnected !== value) {
  //     this._isConnected = value;
  //     this._notifyListeners();
  //   }
  // }

  // set deviceId(value) {
  //   if (this._deviceId !== value) {
  //     this._deviceId = value;
  //     this._notifyListeners();
  //   }
  // }

  // set deviceName(value) {
  //   if (this._deviceName !== value) {
  //     this._deviceName = value;
  //     this._notifyListeners();
  //   }
  // }

  // set passwordVerified(value) {
  //   if (this._passwordVerified !== value) {
  //     this._passwordVerified = value;
  //     this._notifyListeners();
  //   }
  // }


  /**
   * 获取当前语言设置
   * @returns {string} 当前语言代码
   */
  get locale() {
    return this._locale;
  }

  /**
   * 添加状态变化监听器
   * @param {Function} listener - 监听器函数
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this._listeners.includes(listener)) {
      this._listeners.push(listener);
    }
  }

  /**
   * 移除状态变化监听器
   * @param {Function} listener - 监听器函数
   */
  _removeAllListeners() {
    this._listeners = [];
  }

  /**
   * 清除所有监听器
   */
  clearListeners() {
    this._listeners = [];
  }

  /**
   * 获取监听器数量
   * @returns {number} 监听器数量
   */
  getListenerCount() {
    return this._listeners ? this._listeners.length : 0;
  }

  get listeners() {
    return this._listeners;
  }
  /**
   * 通知所有监听器状态已改变
   * @private
   */
  _notifyListeners() {
    if (!this._listeners || this._listeners.length === 0) {
      return;
    }

    // 传递当前状态数据给监听器
    const stateData = {
      locale: this._locale,
      isConnected: this._isConnected,
      isScanning: this._isScanning,
      batteryData: this._batteryData,
      discoveredPeripherals: this._discoveredPeripherals,
      parameterValues: this._parameterValues,
      versionName: this._versionName,
      deviceId: this._deviceId,
      deviceName: this._deviceName,
      passwordVerified: this._passwordVerified,
      lastError: this._lastError,
      isConnectionEnabled: this._isConnectionEnabled,
    };

    this._listeners.forEach((listener, index) => {
      try {
        listener(stateData);
      } catch (error) {
        console.error(`监听器 ${index + 1} 执行出错:`, error);
      }
    });

    // 同步状态到Vuex
    this._syncStateToVuex();
    
    // 触发全局连接状态变化事件
    if (typeof uni !== 'undefined' && uni.$emit) {
      try {
        const globalEventData = {
          isConnected: this._isConnected,
          deviceId: this._deviceId,
          deviceName: this._deviceName,
          isScanning: this._isScanning,
          lastError: this._lastError,
          timestamp: Date.now()
        };
        uni.$emit('bleConnectionStatusChanged', globalEventData);
      } catch (error) {
        console.error('触发全局事件失败:', error);
      }
    }
  }

  /**
   * 同步状态到Vuex store
   * @private
   */
  _syncStateToVuex() {
    try {
      // 检查是否在uni-app环境中且有store可用
      if (typeof uni !== 'undefined' && uni.getStorageSync) {
        // 获取当前页面实例
        const pages = getCurrentPages();
        if (pages && pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          if (currentPage && currentPage.$vm && currentPage.$vm.$store) {
            const store = currentPage.$vm.$store;
            
            // 同步蓝牙管理器状态
            store.dispatch('updateBleManagerState', {
              isConnected: this._isConnected,
              isScanning: this._isScanning,
              isConnectionEnabled: this._isConnectionEnabled,
              deviceId: this._deviceId,
              deviceName: this._deviceName,
              versionName: this._versionName,
              passwordVerified: this._passwordVerified,
              lastError: this._lastError,
              discoveredPeripherals: this._discoveredPeripherals,
              batteryData: this._batteryData,
              parameterValues: Object.fromEntries(this._parameterValues),
              locale: this._locale,
              writeCharacteristic: this._writeCharacteristic,
            });

            // 同步电池数据到主状态
            store.dispatch('updateBluetoothData', {
              totalVoltage: this._batteryData.totalVoltage.toFixed(2),
              voltageDiff: this._batteryData.voltageDiff.toFixed(4),
              lowestString: this._batteryData.lowestString,
              highestString: this._batteryData.highestString,
              minVoltage: this._batteryData.minVoltage.toFixed(4),
              maxVoltage: this._batteryData.maxVoltage.toFixed(4),
              averageVoltage: this._batteryData.averageVoltage.toFixed(4),
              current: this._batteryData.current.toFixed(2),
              power: this._batteryData.power.toFixed(2),
              ratio: this._batteryData.ratio.toFixed(2),
              capacity: this._batteryData.capacity.toFixed(4),
              totalCapacity: this._batteryData.totalCapacity.toFixed(4),
              mosTemperature: this._batteryData.mosTemperature.toFixed(1),
              balanceTemperature: this._batteryData.balanceTemperature.toFixed(1),
              chip1Temperature: this._batteryData.chip1Temperature.toFixed(1),
              chip2Temperature: this._batteryData.chip2Temperature.toFixed(1),
              balanceStatus: [...this._batteryData.balanceStatus],
              voltages: [...this._batteryData.voltages],
              temperatures: [...this._batteryData.temperatures],
              stringDrop: this._batteryData.stringDrop || 0,
              dataQuality: 'normal',
              cycleCapacity: this._batteryData.totalCapacity.toFixed(4),
              batteryCapacity: this._batteryData.totalCapacity.toFixed(4),
              remainingPower: this._batteryData.power.toFixed(2),
              chip1Temp: this._batteryData.chip1Temperature.toFixed(1),
              chip2Temp: this._batteryData.chip2Temperature.toFixed(1),
              mosTemp: this._batteryData.mosTemperature.toFixed(1),
              balanceTemp: this._batteryData.balanceTemperature.toFixed(1),
              cellTemp1: this._batteryData.temperatures[0] ? this._batteryData.temperatures[0].toFixed(1) : '0.0',
              cellTemp2: this._batteryData.temperatures[1] ? this._batteryData.temperatures[1].toFixed(1) : '0.0',
              cellTemp3: this._batteryData.temperatures[2] ? this._batteryData.temperatures[2].toFixed(1) : '0.0',
              cellTemp4: this._batteryData.temperatures[3] ? this._batteryData.temperatures[3].toFixed(1) : '0.0',
            });

            // 同步连接状态
            // store.dispatch('setConnectionStatus', this._isConnected);
            // store.dispatch('setPasswordVerified', this._passwordVerified);
            store.dispatch('setCurrentBatteryPercentage', this._calculateBatteryPercentage());
          }
        }
      }
    } catch (error) {
      console.error('同步状态到Vuex失败:', error);
    }
  }

  /**
   * 计算电池电量百分比
   * @private
   * @returns {number} 电池电量百分比 (0-100)
   */
  _calculateBatteryPercentage() {
    try {
      const currentVoltage = this._batteryData.totalVoltage || 0;
      const minVoltage = this._batteryData.minVoltage || 3.0;
      const maxVoltage = this._batteryData.maxVoltage || 4.2;
      
      if (maxVoltage <= minVoltage) {
        return 0;
      }
      
      let percentage = ((currentVoltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
      percentage = Math.min(Math.max(percentage, 0), 100);
      
      return Number(percentage.toFixed(2));
    } catch (error) {
      console.error('计算电池电量失败:', error);
      return 0;
    }
  }

  // /**
  //  * 保存语言设置到本地存储
  //  * @param {string} locale - 语言代码
  //  * @private
  //  */
  // _saveLocaleToStorage(locale) {
  //   try {
  //     // uni-app方式
  //     uni.setStorageSync('app_locale', locale);

  //     // 或者使用localStorage（H5平台）
  //     // localStorage.setItem('app_locale', locale);

  //     console.log(`语言设置已保存: ${locale}`);
  //   } catch (error) {
  //     console.error('保存语言设置失败:', error);
  //   }
  // }
  /**
   * 初始化蓝牙状态监听器
   * @private
   */
  _initializeBluetoothStateListener() {
    console.log('正在初始化蓝牙状态监听器...');
    // 监听蓝牙适配器状态变化
    this._setupAdapterStateListener();

    console.log('蓝牙状态监听器已初始化');
  }

  /**
   * 设置扫描结果监听器
   * @private
   */
  async _setupScanResultsListener() {
    console.log('_setupScanResultsListener', this._discoveredPeripherals);
    try {
      await this._getAlreadyDiscoveredDevices();
    } catch (error) {
      console.log('获取已发现设备失败，可能是首次扫描:', error);
    }

    // 2. 设置监听器监听新发现的设备
    uni.onBluetoothDeviceFound((res) => {
      this._handleDeviceFound(res);
    });
  }

  async _getAlreadyDiscoveredDevices() {
    return new Promise((resolve, reject) => {
      uni.getBluetoothDevices({
        success: (res) => {
          if (res.devices && Array.isArray(res.devices)) {
            // 处理已发现的设备
            this._handleDeviceFound({
              devices: res.devices,
            });
          }
          resolve(res);
        },
        fail: (error) => {
          console.log('获取已发现的设备失败:', error);
          // 不算作错误，可能是还没有发现任何设备
          resolve({
            devices: []
          });
        }
      });
    });
  }

  _handleDeviceFound(res) {
    if (!res.devices || !Array.isArray(res.devices)) {
      return;
    }

    for (const device of res.devices) {
      const name = (device.name || device.localName || '').toString().trim();
      if (!name) continue; // 仍然只展示有名称的设备

      const idx = this._discoveredPeripherals.findIndex(d => d.deviceId === device.deviceId);
      if (idx !== -1) continue;
      // 判断是否为未知设备
      const isUnknownDevice = /未知|unknown/i.test(name);
      const deviceData = {
        deviceId: device.deviceId,
        name,
        RSSI: device.RSSI || 0,
        advertisData: device.advertisData || {},
        advertisServiceUUIDs: device.advertisServiceUUIDs || [],
        localName: device.localName || '',
        serviceData: device.serviceData || {}
      };
      
      // 根据设备类型决定添加位置
      isUnknownDevice 
        ? this._discoveredPeripherals.push(deviceData) 
        : this._discoveredPeripherals.unshift(deviceData);
    }

    this._notifyListeners();
  }

  /**
   * 设置适配器状态监听器
   * @private
   */
  _setupAdapterStateListener() {
    this._openBluetoothAdapter();

    // 先检查蓝牙适配器是否可用
    uni.getBluetoothAdapterState({
      success: (res) => {
        console.log('蓝牙适配器状态:', res);
        // 如果蓝牙可用，再设置监听器
        if (res.available || res.adapterState.available) {
          this._setupStateListener();
        } else {
          console.log('蓝牙适配器不可用，尝试打开');
          this._openBluetoothAdapter();
        }
      },
      fail: (err) => {
        console.error('获取蓝牙适配器状态失败:', err);
        // 即使获取状态失败，也尝试设置监听器
        this._setupStateListener();
      }
    });
  }
  /**
   * 设置状态监听器
   * @private
   */
  _setupStateListener() {
    console.log('开始设置蓝牙状态监听器');

    // 监听蓝牙适配器状态变化
    uni.onBluetoothAdapterStateChange((res) => {
      console.log('蓝牙适配器状态改变:', res);

      // 验证响应数据
      if (!res) {
        console.warn('蓝牙适配器状态响应数据无效:', res);
        return;
      }

      const state = (res.available || res.adapterState.available) ? 'on' : 'off';
      const discovering = res.discovering || false;
      const connected = res.connected || false;

      console.log(`蓝牙状态: ${state}, 扫描中: ${discovering}, 已连接: ${connected}`);

      // 使用映射对象处理状态
      const stateHandlers = {
        'on': () => this._handleBluetoothOn(),
        'off': () => this._handleBluetoothOff(),
        'unauthorized': () => {
          console.log("蓝牙未授权");
          this._lastError = "请在设置中开启蓝牙权限";
          this._notifyListeners();
        },
        'unavailable': () => {
          console.log(`蓝牙状态: ${state}`);
        }
      };

      const handler = stateHandlers[state];
      if (handler) {
        handler();
      } else {
        console.warn(`未知的蓝牙状态: ${state}`);
        this._handleUnknownBluetoothState(state);
      }
    });

    console.log('蓝牙状态监听器设置完成');
  }

  /**
   * 打开蓝牙适配器
   * @private
   */
  _openBluetoothAdapter() {
    uni.openBluetoothAdapter({
      success: (res) => {
        console.log('蓝牙适配器打开成功:', res);
        // 打开成功后设置监听器
        this._setupStateListener();
      },
      fail: (err) => {
        console.error('蓝牙适配器打开失败:', err);
        if (err.errMsg && err.errMsg.includes('already opened')) {
          console.log('蓝牙适配器已经打开');
          this._setupStateListener();
        } else {
          this._handleBluetoothInitError(err);
        }
      }
    });
  }

  /**
   * 处理蓝牙开启状态
   * @private
   */
  _handleBluetoothOn() {
    console.log("蓝牙已开启，开始扫描设备");
    // 重置错误状态
    this._lastError = null;
    uni.openBluetoothAdapter({
      success: (res) => {
        console.log('蓝牙适配器初始化成功:', res);
        this.bluetoothAdapter = res;
      },
      fail: (err) => {
        console.error('蓝牙适配器初始化失败:', err);
        if (err.errMsg && err.errMsg.includes('already opened')) {
          // 蓝牙适配器已经打开，直接返回成功
          console.log('蓝牙适配器已经打开');
          this._setupStateListener();
        } else {
          this._handleBluetoothInitError(err);
        }
      }
    });
  }
  /**
   * 处理蓝牙关闭状态
   * @private
   */
  _handleBluetoothOff() {
    console.log("蓝牙已关闭，清理连接状态");

    // 重置连接状态
    this._isConnected = false;
    this._peripheral = null; // 清除设备连接

    // 清空发现的设备列表
    this._discoveredPeripherals.length = 0;

    // 停止扫描
    this._isScanning = false;

    this.dispose();
    // --- 结束：蓝牙关闭时释放BluetoothWriter ---

    // 清理特征值
    this._writeCharacteristic = null;
    this._notifyCharacteristic = null;

    // 通知监听器
    this._notifyListeners();
  }

  /**
   * 切换连接功能
   * @param {boolean} isEnabled - 是否启用连接功能
   */
  toggleConnection(isEnabled) {
    if (this._isConnectionEnabled !== isEnabled) {
      this._isConnectionEnabled = isEnabled;
      this._notifyListeners();
    }
  }
  /**
   * 开始扫描蓝牙设备
   */
  async startScanning() {
    try {
      // 如果已连接，不进行扫描
      if (this._isConnected) {
        console.log('设备已连接，跳过扫描');
        return;
      }
      // 不区分首次与否：每次扫描前清空结果并强制重启扫描
      if (this._isScanning) {
        await this.stopScanning();
      }

      this._discoveredPeripherals.length = 0;
      this._notifyListeners();

      await this._startBluetoothScan();
      this._setScanTimeout(10000);
    } catch (error) {
      console.error('开始扫描蓝牙设备失败:', error);
      this._lastError = "开始扫描蓝牙设备失败";
      this._notifyListeners();
    }
  }

  /**
   * 开始扫描蓝牙设备
   * @param {number} timeout - 扫描超时时间（毫秒）
   */
  async _startBluetoothScan(timeout = 10000) {
    console.log('蓝牙扫描启动成功');

    // 1. 首先确保蓝牙适配器已初始化
    await this._ensureBluetoothAdapterInitialized();

    // 2. 开始搜寻附近的蓝牙外围设
    await this._startBluetoothDevicesDiscovery();

    // 3. 开始发现设备
    await this._setupScanResultsListener();
  }
  async _ensureBluetoothAdapterInitialized() {
    return new Promise((resolve, reject) => {
      // 先检查蓝牙适配器状态
      uni.getBluetoothAdapterState({
        success: (res) => {
          if (res.available || res.adapterState.available) {
            resolve(res);
          } else {
            this._openBluetoothAdapter(resolve, reject);
          }
        },
        fail: (err) => {
          console.error('获取蓝牙适配器状态失败:', err);
          this._openBluetoothAdapter(resolve, reject);
        }
      });
    });
  }

  async _startBluetoothDevicesDiscovery() {

    return new Promise((resolve, reject) => {
      uni.startBluetoothDevicesDiscovery({
        success: (res) => {
          this._isScanning = true;
          this._notifyListeners();
          resolve(res);
        },
        fail: (err) => {
          if (err.errMsg && err.errMsg.includes('already discovering')) {
            console.error('蓝牙设备搜索启动失败:', err);
            this._setupScanResultsListener();
            resolve(err);
          } else {
            this._isScanning = false;
            reject(new Error(`设备搜索失败: ${err.errMsg || err.message}`));
          }
        }
      });
    });
  }
  /**
   * 设置扫描超时
   * @private
   * @param {number} timeout - 超时时间（毫秒）
   */
  _setScanTimeout(timeout = 10000) {
    // 清除之前的超时定时器
    if (this._scanTimeoutTimer) {
      clearTimeout(this._scanTimeoutTimer);
    }

    // 设置新的超时定时器
    this._scanTimeoutTimer = setTimeout(async () => {
      console.log(`扫描超时（${timeout/1000}秒），自动停止扫描`);
      await this.stopScanning();
    }, timeout);
  }
  /**
   * 停止扫描蓝牙设备
   */
  stopScanning() {
    try {
      // 如果没有在扫描，直接返回
      if (!this._isScanning) return;
      this._isScanning = false;

      console.log('停止设备扫描...');

      // 清除扫描超时定时器
      if (this._scanTimeoutTimer) {
        clearTimeout(this._scanTimeoutTimer);
        this._scanTimeoutTimer = null;
      }

      // 停止扫描
      uni.stopBluetoothDevicesDiscovery({
        success: (res) => {
          console.log('扫描停止成功:', res);
        },
        fail: (err) => {
          console.error('扫描停止失败:', err);
          // 即使停止失败，也要重置状态
        }
      });

      // 更新扫描状态并通知
      console.log('设备扫描已停止');
      this._notifyListeners();

    } catch (error) {
      console.error('停止扫描过程出错:', error);
      // 确保状态被重置
      this._isScanning = false;
      this._notifyListeners();
    }
  }

  /**
   * 重新连接设备
   */
  async reconnect() {
    console.log('尝试重新连接设备...');

    try {
      // 检查是否有已保存的设备信息
      if (this._peripheral !== null) {
        console.log(`发现已保存的设备: ${this._peripheral.name || this._peripheral.deviceId}`);

        // 检查连接功能是否启用
        if (this._isConnectionEnabled) {
          console.log('连接功能已启用，尝试连接设备');
          return await this.connect(this._peripheral);
        }
      } else {
        console.log('没有已保存的设备信息，开始扫描寻找设备');
        // 如果没有设备信息，开始扫描
        return await this.startScanning();
      }

    } catch (error) {
      console.error('重连失败:', error);
      this._lastError = `重连失败: ${error.message}`;
      this._notifyListeners();
    }
  }

  /**
   * 连接到指定设备
   * @param {Object} peripheral - 要连接的设备
   * @returns {Promise<boolean>} 连接是否成功
   */
  async connect(peripheral) {
    console.log('connect: ', peripheral);
    try {
      // 停止扫描
      // await this.stopScanning();
      // console.log('扫描已停止');

      // 保存设备信息
      this._peripheral = peripheral;
      // 建立BLE连接
      await this._establishBLEConnection(peripheral);
      console.log(`成功连接到设备: ${peripheral.name || peripheral.deviceId}`);

      // 设置连接状态监听
      this._setupConnectionStateListener();

      // 发现服务和特征值
      await this._discoverServicesAndCharacteristics(peripheral);

      // 更新设备信息
      this._deviceName = peripheral.name || '';
      this._deviceId = peripheral.deviceId;
      this._isConnected = true;
      this._isConnectionEnabled = true; // 同步连接功能状态

      // 通知监听器
      this._notifyListeners();

      // 等待设备稳定（2秒）
      await this._waitForDeviceStabilization();


      // 启动自动刷新（心跳机制）
      await this.startAutoRefresh();

      console.log(`设备连接完成: ${peripheral.name || peripheral.deviceId}`);

    } catch (error) {
      console.error('连接设备失败:', error);
      this._isConnected = false;
      this._lastError = '连接设备失败';
      this._bluetoothWriter.dispose();
      this._notifyListeners()
    }
  }

  /**
   * 建立BLE连接
   * @private
   * @param {Object} peripheral - 设备对象
   */
  async _establishBLEConnection(peripheral) {
    console.log('establishBLEConnection', peripheral);

    // 建立BLE连接
    return await new Promise((resolve, reject) => {
      uni.createBLEConnection({
        deviceId: peripheral.deviceId,
        success: (res) => {
          this._isConnected = true;
          console.log('BLE连接成功:', res);
          this._notifyListeners();
          resolve(res);
        },
        fail: (err) => {
          this._isConnected = false;
          this._notifyListeners();
          this.disconnect();
          console.error('BLE连接失败:', err);
          reject(new Error(`连接失败: ${err.errMsg}`));
        }
      });
    });
  }

  /**
   * 设置连接状态监听
   * @private
   */
  _setupConnectionStateListener() {
    // 监听BLE连接状态变化
    uni.onBLEConnectionStateChange((res) => {
      console.log('BLE连接状态变化:', res);

      if (!res.connected) {
        // 设备断开连接
        console.log('设备断开连接');
        this._isConnected = false;
        this._handleDeviceDisconnection();
      } else {
        // 设备连接
        console.log('设备已连接');
        this._isConnected = true;
        this._notifyListeners();
      }
    });
  }

  /**
   * 处理设备断开连接
   * @private
   */
  _handleDeviceDisconnection() {
    console.log('处理设备断开连接...');

    // 重置连接状态
    this._isConnected = false;
    this._passwordVerified = false;

    // 停止密码定时器
    this._stopPasswordTimer();

    // 释放蓝牙写入器
    if (this._bluetoothWriter) {
      this._bluetoothWriter.dispose();
    }

    // 停止故障延时定时器
    this.stopGZYSTimer();

    // 移除所有状态变化监听器
    this._removeAllListeners();

    // 清空设备信息
    this._peripheral = null;
    this._writeCharacteristic = null;
    this._notifyCharacteristic = null;

    // 通知监听器
    this._notifyListeners();
    // 注意：这里不自动重连，避免无限重连循环
    // 如果需要自动重连，可以在这里添加逻辑
    console.log('设备断开连接处理完成');
  }



  /**
   * 等待设备稳定
   * @private
   */
  async _waitForDeviceStabilization() {
    console.log('等待设备稳定...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('设备稳定等待完成');
  }

  /**
   * 发现服务和特征值
   * @private
   * @param {Object} peripheral - 设备对象
   */
  async _discoverServicesAndCharacteristics(peripheral) {
    try {
      console.log('开始发现服务和特征值...');
      // 获取设备服务
      const services = await this._getBLEDeviceServices(peripheral.deviceId);
      let serviceFound = false;
      let notifyCharacteristicFound = false;
      let writeCharacteristicFound = false;
      console.log('发现的服务:', services);

      // 遍历服务，获取特征值
      for (const service of services.services) {
        console.log(`检查服务: ${service.uuid}`);

        // 检查是否是目标服务
        if (service.uuid === this.constructor.SERVICE_UUID) {
          serviceFound = true;
          console.log('找到目标服务:', service.uuid);

          // 获取该服务的特征值
          const characteristics = await this._getBLEDeviceCharacteristics(
            peripheral.deviceId,
            service.uuid
          );
          console.log(`服务 ${service.uuid} 的特征值:`, characteristics);

          // 遍历特征值
          for (const characteristic of characteristics.characteristics) {
            // 处理通知特征值
            if (characteristic.uuid === this.constructor.NOTIFY_CHARACTERISTIC_UUID) {
              this._notifyCharacteristic = {
                deviceId: peripheral.deviceId,
                serviceId: service.uuid,
                characteristicId: characteristic.uuid,
                properties: characteristic.properties,
              };
              if (this._notifyCharacteristic) {
                await this._enableNotifyCharacteristic();
                // 启用通知
                notifyCharacteristicFound = true;
              }
            } else if (characteristic.uuid === this.constructor.WRITE_CHARACTERISTIC_UUID) {
              this._writeCharacteristic = {
                deviceId: peripheral.deviceId,
                serviceId: service.uuid,
                characteristicId: characteristic.uuid,
                properties: characteristic.properties,
              };
              writeCharacteristicFound = true;

              // --- 开始：为BluetoothWriter设置特征值 ---
              if (this._bluetoothWriter) {
                this._bluetoothWriter.setCharacteristic(this._writeCharacteristic);
              }
            }
          }

          // 如果找到了必要的特征值，跳出循环
          if (this._notifyCharacteristic !== null && this._writeCharacteristic !== null) {
            console.log('已找到所有必要的特征值，停止搜索');
            break;
          }
        }
      }

      if (this._writeCharacteristic) {
        this.readParameters();
      }
      // 检查是否找到目标服务
      if (!serviceFound) {
        throw new Error(`未找到目标服务: ${this.constructor.SERVICE_UUID}`);
      }

      // 检查是否找到必要的特征值
      if (!notifyCharacteristicFound || !writeCharacteristicFound) {
        throw new Error('未找到必要的特征值');
      }
    } catch (error) {
      console.error('发现服务和特征值失败:', error);
      throw error;
    }
  }

  /**
   * 获取BLE设备服务
   * @private
   * @param {string} deviceId - 设备ID
   */
  async _getBLEDeviceServices(deviceId) {
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceServices({
        deviceId: deviceId,
        success: resolve,
        fail: reject
      });
    });
  }

  /**
   * 获取BLE设备特征值
   * @private
   * @param {string} deviceId - 设备ID
   * @param {string} serviceId - 服务ID
   */
  async _getBLEDeviceCharacteristics(deviceId, serviceId) {
    return new Promise((resolve, reject) => {
      uni.getBLEDeviceCharacteristics({
        deviceId: deviceId,
        serviceId: serviceId,
        success: resolve,
        fail: reject
      });
    });
  }

  /**
   * 处理通知特征值
   * @private
   */
  async _enableNotifyCharacteristic() {
    try {
      // 检查通知特征值是否存在
      if (this._notifyCharacteristic === null) {
        console.error('通知特征值未设置');
        return;
      }

      console.log('处理通知特征值:', this._notifyCharacteristic.characteristicId);

      // 检查特征值属性
      const properties = this._notifyCharacteristic.properties;

      if (properties && properties.notify) {
        // 启用通知
        await this._notifyCharacteristicValue(true);
        console.log("已订阅通知");

      } else if (properties && properties.read) {
        // 如果支持读取，执行初始读取
        await this._readCharacteristicValue();
        console.log("已执行通知特征值的初始读取");

      } else {
        console.warn('通知特征值不支持notify或read属性');
      }
      // 设置特征值变化监听（无论是否支持notify都要设置）
      this._setupCharacteristicValueChangeListener();
    } catch (error) {
      console.error('处理通知特征值失败:', error);
      throw error;
    }
  }

  /**
   * 设置通知值
   * @private
   * @param {boolean} state - 是否启用通知
   */
  async _notifyCharacteristicValue(state) {
    return new Promise((resolve, reject) => {
      uni.notifyBLECharacteristicValueChange({
        deviceId: this._notifyCharacteristic.deviceId,
        serviceId: this._notifyCharacteristic.serviceId,
        characteristicId: this._notifyCharacteristic.characteristicId,
        state: state,
        success: (res) => {
          console.log('设置通知状态成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('设置通知状态失败:', err);
          reject(new Error(`设置通知失败: ${err.errMsg}`));
        }
      });
    });
  }

  /**
   * 读取特征值
   * @private
   */
  async _readCharacteristicValue() {
    return new Promise((resolve, reject) => {
      uni.readBLECharacteristicValue({
        deviceId: this._notifyCharacteristic.deviceId,
        serviceId: this._notifyCharacteristic.serviceId,
        characteristicId: this._notifyCharacteristic.characteristicId,
        success: (res) => {
          console.log('读取特征值成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('读取特征值失败:', err);
          if (ree.code === 10007) {
            console.log('特征值不支持读取，尝试启用通知...');
              this._enableNotifyCharacteristic().then(() => {
                console.log('通知已启用，数据将通过通知方式获取');
                resolve({ message: '数据将通过通知方式获取' });
              }).catch(reject);
          } else {
            reject(new Error(`读取特征值失败: ${err.errMsg}`));
          }
        }
      });
    });
  }

  /**
   * 设置特征值变化监听
   * @private
   */
  _setupCharacteristicValueChangeListener() {
    // 移除之前的监听器（如果存在）
    this._removeCharacteristicValueChangeListener();

    // 设置新的监听器
    uni.onBLECharacteristicValueChange((res) => {
      // 检查是否是我们的通知特征值
      if (this._notifyCharacteristic && res.characteristicId === this._notifyCharacteristic.characteristicId) {
        // 处理接收到的数据
        if (res.value) {
          const data = new Uint8Array(res.value);
          this._handleReceivedData(data);
        }
      }
    });

    console.log('特征值变化监听器已设置');
  }

  /**
   * 移除特征值变化监听
   * @private
   */
  _removeCharacteristicValueChangeListener() {
    try {
      uni.offBLECharacteristicValueChange();
      console.log('特征值变化监听器已移除');
    } catch (error) {
      console.warn('移除特征值变化监听器失败:', error);
    }
  }

  /**
   * 处理接收到的数据
   * @private
   * @param {Uint8Array} data - 接收到的数据
   */
  _handleReceivedData(data) {
    try {
      // 将Uint8Array转换为字符串
      const string = this._uint8ArrayToString(data);

      // 添加到接收缓冲区
      this._receiveBuffer += string;

      // 检查数据是否包含换行符
      if (this._receiveBuffer.includes("\n")) {
        // 数据包可能包含多个完整数据，按换行符分割处理
        const components = this._receiveBuffer.split("\n");

        // 处理除最后一个外的所有完整数据片段
        for (let i = 0; i < components.length - 1; i++) {
          const completePacket = components[i];
          if (completePacket.trim().length > 0) {
            this._processReceivedData(completePacket);
          }
        }

        // 处理最后一个片段
        if (this._receiveBuffer.endsWith("\n")) {
          // 如果原始数据以换行符结尾，则最后一个片段也是完整的
          if (components[components.length - 1].trim().length > 0) {
            this._processReceivedData(components[components.length - 1]);
          }
          this._receiveBuffer = ""; // 清空缓冲区
          console.log("缓冲区已清空");
        } else {
          // 保留最后一个不完整的片段
          this._receiveBuffer = components[components.length - 1];
          console.log("保留不完整片段:", this._receiveBuffer);
          this._startProcessingTimer();
        }
      } else {
        // 数据不包含换行符，等待更多数据
        console.log("数据不完整，等待更多数据");
        this._startProcessingTimer();
      }
    } catch (error) {
      console.error('处理接收数据失败:', error);
      // 出错时清空缓冲区，避免数据混乱
      this._receiveBuffer = "";
    }
    // 这里可以添加具体的数据处理逻辑
    // 例如：解析协议、处理命令响应等
  }


  /**
   * 将Uint8Array转换为字符串
   * @private
   * @param {Uint8Array} data - 数据
   * @returns {string} 字符串
   */
  _uint8ArrayToString(data) {
    try {
      // 检查TextDecoder是否可用
      if (typeof TextDecoder !== 'undefined') {
        // 方法1：使用TextDecoder（推荐）
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(data);
      } else {
        // TextDecoder不可用，使用备用方法
        console.log("TextDecoder不可用，使用备用转换方法");
        return this._uint8ArrayToStringFallback(data);
      }
    } catch (error) {
      console.warn('TextDecoder失败，使用备用方法:', error);
      // 使用备用转换方法
      return this._uint8ArrayToStringFallback(data);
    }
  }

  /**
   * 备用Uint8Array转字符串方法
   * @private
   * @param {Uint8Array} data - 要转换的数据
   * @returns {string} 转换后的字符串
   */
  _uint8ArrayToStringFallback(data) {
    try {
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(data[i]);
      }
      return result;
    } catch (error) {
      console.error("备用字符串转换也失败:", error);
      // 最后的备用方案：返回空字符串
      return '';
    }
  }

  /**
   * 将ArrayBuffer转换为十六进制字符串用于日志
   * @param {Uint8Array} data - 要转换的数据
   * @returns {string} 十六进制字符串
   */
  _arrayBufferToHex(data) {
    try {
      return Array.from(data)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(' ');
    } catch (error) {
      console.error("ArrayBuffer转十六进制失败:", error);
      return '';
    }
  }

  /**
   * 启动处理定时器
   * @private
   * @param {number} delay - 延时时间（毫秒），默认100ms
   */
  _startProcessingTimer(delay = 500) {
    // 清除现有定时器
    this._stopProcessingTimer();

    this._processingTimer = setTimeout(() => {
      if (this._receiveBuffer.length > 0) {
        this._processReceivedData(this._receiveBuffer);
        this._receiveBuffer = "";
      }
    }, delay);
  }

  /**
   * 停止处理定时器
   * @private
   */
  _stopProcessingTimer() {
    if (this._processingTimer) {
      clearTimeout(this._processingTimer);
      this._processingTimer = null;
    }
  }

  /**
   * 处理缓冲区数据
   * @private
   */
  _processReceivedData(completeData) {
    const processedString = completeData.trim();

    const dataArray = processedString.split(" ").filter(item => item.length > 0);

    if (dataArray.length === 0) {
      return;
    }
    try {
      // 处理每个数据项
      for (const item of dataArray) {
        // 处理密码验证响应
        if (item === PasswordResponse.SUCCESS || item === PasswordResponse.FAILURE) {
          this._handlePasswordResponse(item);
          continue;
        } else if (item === "RES") {
          this._showToast(this.t("restarted"));
          continue;
        }
        // 处理状态命令
        if (item.includes("cdopen")) {
          this._updateStatus({
            chargingStatus: true
          });
          this.clearCdDeviceStatus();
        } else if (item.includes("cdclose")) {
          this._updateStatus({
            chargingStatus: false
          });
          if (item.startsWith('cdclose') && item.length > 7) {
            this._handleCdCloseStatus(item);
          }
        } else if (item.includes("fdopen")) {
          this._updateStatus({
            dischargingStatus: true
          });
          this.clearFdDeviceStatus();
        } else if (item.includes("fdclose")) {
          this._updateStatus({
            dischargingStatus: false
          });
          if (item.startsWith('fdclose') && item.length > 7) {
            this._handleFdCloseStatus(item);
          }
        } else if (item.includes("jhstop")) {
          this._updateStatus({
            balancingStatus: false
          });
        } else if (item.startsWith("jhzt")) {
          const parsedData = this._parseLine(item);
          if (parsedData) {
            this._updateBatteryDataOnMain(parsedData.key, parsedData.value);
          }
        } else {
          // 处理键值对数据
          const parsedData = this._parseLine(item);
          if (parsedData) {
            this._updateBatteryDataOnMain(parsedData.key, parsedData.value);
          }
        }
        // 处理中间为=的内容（设置参数）
        const parts = item.split("=");
        if (parts.length === 2) {
          const keyOfEqual = parts[0].trim();
          const value = parts[1].trim();
          this._handleParameterSetting(keyOfEqual, value);
        }
      }
      this._notifyListeners();
    } catch (error) {
      console.error('处理缓冲区数据出错:', error);
    }
  }

  _handleParameterSetting(key, value) {
    switch (key) {
      case 'CS':
        // 串数设置
        this._parameterValues = AppConstants.setCommandMap('CS', this._parameterValues, value);
        this._batteryData.totalStrings = Math.max(0, Math.min(252, parseInt(value) || 0));
        console.log(`Updated CS value: ${value}, displayed strings: ${this._batteryData.totalStrings}`);
        break;
      case 'gybh':
        // 过压保护
        this._parameterValues = AppConstants.setCommandMap('gybh', this._parameterValues, value);
        break;
      case 'gyhf':
        // 过压恢复
        this._parameterValues = AppConstants.setCommandMap('gyhf', this._parameterValues, value);
        break;
      case 'qyhf':
        // 欠压恢复
        this._parameterValues = AppConstants.setCommandMap('qyhf', this._parameterValues, value);
        break;
      case 'qybh':
        // 欠压保护 - 修复：之前错误地使用了qyhf
        this._parameterValues = AppConstants.setCommandMap('qybh', this._parameterValues, value);
        break;
      case 'usergw':
        // 探头高温
        this._parameterValues = AppConstants.setCommandMap('usergw', this._parameterValues, value);
        break;
      case 'userhf':
        // 探头恢复
        this._parameterValues = AppConstants.setCommandMap('userhf', this._parameterValues, value);
        break;
      case 'mosgw':
        // MOS高温
        this._parameterValues = AppConstants.setCommandMap('mosgw', this._parameterValues, value);
        break;
      case 'moshf':
        // MOS恢复
        this._parameterValues = AppConstants.setCommandMap('moshf', this._parameterValues, value);
        break;
      case 'jhyc':
        // 均衡压差
        this._parameterValues = AppConstants.setCommandMap('jhyc', this._parameterValues, value);
        break;
      case 'jhwd':
        // 均衡温度
        this._parameterValues = AppConstants.setCommandMap('jhwd', this._parameterValues, value);
        break;
      case 'dcrl':
        // 电池容量
        this._parameterValues = AppConstants.setCommandMap('dcrl', this._parameterValues, value);
        break;      
      case 'ycjh':
        // 压差均衡
        this._parameterValues = AppConstants.setCommandMap('ycjh', this._parameterValues, value);
        break;    
      case 'jhqd':
        // 均衡启动
        this._parameterValues = AppConstants.setCommandMap('jhqd', this._parameterValues, value);
        break;
      case 'dqdl':
        // 当前电流
        this._parameterValues = AppConstants.setCommandMap('dqdl', this._parameterValues, value);
        break;
      case 'gzys':
        // 故障延时
        this._parameterValues = AppConstants.setCommandMap('gzys', this._parameterValues, value);
        break;
      case 'glbh':
        // 过流保护
        this._parameterValues = AppConstants.setCommandMap('glbh', this._parameterValues, value);
        break;
      case 'cdgl':
        // 充电过流
        this._parameterValues = AppConstants.setCommandMap('cdgl', this._parameterValues, value);
        break;
      case 'ycbh':
        // 压差保护
        this._parameterValues = AppConstants.setCommandMap('ycbh', this._parameterValues, value);
        this._batteryData.ycbh = parseFloat(value) || 0;
        break;
      case 'ver':
        // 版本信息
        this._parameterValues = AppConstants.setCommandMap('ver', this._parameterValues, value);
        this._versionName = value;
        break;
      case 'dljd':
        // 电流检测
        this._parameterValues = AppConstants.setCommandMap('dljd', this._parameterValues, value);
        break;
      case 'dlxd':
        // 电流消抖
        this._parameterValues = AppConstants.setCommandMap('dlxd', this._parameterValues, value);
        break;
      case 'dlys':
        // 短路延时
        this._parameterValues = AppConstants.setCommandMap('dlys', this._parameterValues, value);
        break;
      case 'jhpl':
        // 均衡频率
        this._parameterValues = AppConstants.setCommandMap('jhpl', this._parameterValues, value);
        break;
      default:
        console.warn(`未知参数: ${key}`);
        break;
    };
  }
  async startAutoRefresh(interval = 5000) {
    const heartbeatData = this._stringToUint8Array("re");
    await this._bluetoothWriter.setHeartbeat(heartbeatData, interval);
  }

  async stopAutoRefresh() {
    await this._bluetoothWriter.setHeartbeat(null);
  }

  /**
   * 销毁BLE管理器，清理所有资源
   */
  dispose() {
    console.log('开始销毁BLE管理器...');

    try {
      // 先调用BluetoothWriter的dispose
      if (this._bluetoothWriter) {
        this._bluetoothWriter.dispose();
      }

      // 然后执行BLEManager自己的清理
      this._cancelBleSubscription();
      this._stopAllTimers();
      this._clearAllStates();
      if (this._peripheral) {
        // 断开设备连接
        this.disconnect();
      }
      this._removeAllListeners();

      console.log('BLE管理器销毁完成');

    } catch (error) {
      console.error('销毁BLE管理器时出错:', error);
    }
  }

  /**
   * 取消蓝牙订阅
   * @private
   */
  _cancelBleSubscription() {
    try {
      // 取消蓝牙订阅（如果存在）
      if (this.bleSubscription) {
        this.bleSubscription.cancel();
        this.bleSubscription = null;
        console.log('蓝牙订阅已取消');
      }
      // 取消蓝牙设备发现监听
      uni.offBluetoothDeviceFound();

      // 取消蓝牙适配器状态监听
      uni.offBluetoothAdapterStateChange();

      // 取消BLE连接状态监听
      uni.offBLEConnectionStateChange();

      // 取消特征值变化监听
      uni.offBLECharacteristicValueChange();

      // 清空订阅列表
      this._subscriptions.clear();
      this.bleSubscription = null;

      console.log('蓝牙订阅已取消');

    } catch (error) {
      console.error('取消蓝牙订阅失败:', error);
    }
  }

  /**
   * 停止故障延时定时器
   */
  stopGZYSTimer() {
    if (this.gzysTimer !== null) {
      console.log('停止故障延时定时器');

      // 取消定时器
      clearTimeout(this.gzysTimer);
      this.gzysTimer = null;

      // 重置故障延时数据
      if (this._batteryData) {
        this._batteryData.gzys = 0;
        this._batteryData.updateProperty('gzys', this._batteryData.gzys);
        // this._batteryData.update();
      }

      // 通知监听器
      this._notifyListeners();

      console.log('故障延时定时器已停止，数据已重置');
    } else {
      console.log('故障延时定时器不存在，无需停止');
    }
  }

  _stopPasswordTimer() {
    if (this._passwordTimer) {
      clearTimeout(this._passwordTimer);
      this._passwordTimer = null;
      console.log('密码定时器已停止');
    }
  }


  /**
   * 停止所有定时器
   * @private
   */
  _stopAllTimers() {
    try {
      // 停止密码验证定时器
      this._stopPasswordTimer();

      // 停止处理定时器
      if (this._processingTimer) {
        clearTimeout(this._processingTimer);
        this._processingTimer = null;
        console.log('处理定时器已停止');
      }

      // 停止扫描超时定时器
      if (this._scanTimeoutTimer) {
        clearTimeout(this._scanTimeoutTimer);
        this._scanTimeoutTimer = null;
        console.log('扫描超时定时器已停止');
      }
      // 停止故障延时定时器
      this.stopGZYSTimer();

      // 停止心跳定时器
      if (this._heartbeatTimer) {
        clearInterval(this._heartbeatTimer);
        this._heartbeatTimer = null;
        console.log('心跳定时器已停止');
      }

      console.log('所有定时器已停止');

    } catch (error) {
      console.error('停止定时器失败:', error);
    }
  }

  /**
   * 断开设备连接
   * @private
   */
  async disconnect() {
    console.log('disconnect 断开连接', this._isConnected, 333, this._peripheral);
    
    if (this._isConnected && this._peripheral) {
      console.log('断开设备连接...');
      try {
        // 停止密码验证定时器
        this._stopPasswordTimer();

        // 重置密码验证状态
        this._passwordVerified = false;

        this._firstPasswordVerified = false;

        // --- 开始：不需要直接调用_peripheral.disconnect()，BluetoothWriter会处理 ---
        // 相反，我们只需要释放写入器，它会取消定时器和任务，
        // 让connectionState监听器处理实际的_isConnected标志。
        if (this._bluetoothWriter) {
          this._bluetoothWriter.dispose(); // 这会停止心跳并清空队列
        }

        // 仍然显式断开设备连接
        await this._disconnectPeripheral();
        // --- 结束：BluetoothWriter断开连接处理 ---
        
        
        // 立即更新UI
        this._isConnected = false;
        console.log('1111', this._isConnected);

        // 更新开关状态
        this._isConnectionEnabled = false;

        // 通知监听器
        this._notifyListeners();

        // 停止扫描
        await this.stopScanning();

        this._removeAllListeners()
      } catch (error) {
        console.error("断开连接失败:", error);
        console.log('this._peripheral', this._peripheral);
        
        // 即使出错也要重置状态
        this._isConnected = false;
        this._isConnectionEnabled = false;
        this._firstPasswordVerified = false;
        this._passwordVerified = false;
        this._notifyListeners();
      }
      console.log('设备连接已断开');
    } else {
      console.log('设备未连接，跳过断开操作');
    }
  }

  /**
   * 断开设备连接的具体实现
   * @private
   */
  async _disconnectPeripheral() {
    if (!this._peripheral) {
      console.log("设备不存在，跳过断开操作");
      return;
    }

    console.log(`断开设备: ${this._peripheral.name || this._peripheral.deviceId}`);

    try {
      await new Promise((resolve, reject) => {
        uni.closeBLEConnection({
          deviceId: this._peripheral.deviceId,
          success: (res) => {
            console.log('设备断开连接成功:', res);
            resolve(res);
          },
          fail: (err) => {
            console.error('设备断开连接失败:', err);
            // 即使断开失败，也要继续处理
            resolve(err);
          }
        });
      });

      // 清理设备相关资源
      this._cleanupPeripheralResources();

    } catch (error) {
      console.error('断开设备连接过程出错:', error);
      // 即使出错也要清理资源
      this._cleanupPeripheralResources();
    }
  }

  /**
   * 清理设备相关资源
   * @private
   */
  _cleanupPeripheralResources() {
    // 清空特征值
    this._writeCharacteristic = null;
    this._notifyCharacteristic = null;

    // 清空设备信息
    this._peripheral = null;
    this._deviceId = "";
    this._deviceName = "";

    // 停止处理定时器
    this._stopProcessingTimer();

    // 停止故障延时定时器
    this.stopGZYSTimer();

    // 清空错误信息
    this._lastError = null;

    console.log('设备相关资源已清理');
  }

  /**
   * 重命名设备
   * @param {string} newName - 新的设备名称
   */
  async renameDevice(newName) {
    try {
      // 检查连接状态和特征值
      if (!this._isConnected || this._peripheral === null || this._writeCharacteristic === null) {

        console.log("设备未连接或特征值未找到，无法重命名");
        this._showToast(this.t("device_not_connected_rename"));
        return;
      }
      // 构建重命名命令
      const command = `FC-${newName}\r\n`;

      // 将命令转换为Uint8Array
      const data = this._stringToUint8Array(command);
      if (data.length === 0) {
        console.log("命令转换失败");
        this._showToast("命令转换失败");
        return;
      }
      let success = false;

      try {
        success = await this._bluetoothWriter.writeData({
          data: data,
          priority: WritePriority.NORMAL
        });
      } catch (error) {
        console.error("发送重命名命令失败:", error);
        success = false;
      }

      if (success) {
        console.log("重命名命令发送成功");
        this._deviceName = newName;
        this._showToast(this.t("updated"));
      } else {
        console.log("重命名命令发送失败，但仍更新本地名称");
        this._deviceName = newName; // 仍然更新，如果重命名是需要在重连时生效的本地更改
        this._showToast(this.t("updated"));
      }
      // 断开连接以应用新名称
      await this.disconnect();

      // 通知监听器
      this._notifyListeners();
    } catch (error) {
      console.error('重命名设备失败:', error);
      return false;
    }
  }

  /**
   * 将字符串转换为Uint8Array
   * @private
   * @param {string} str - 要转换的字符串
   * @returns {Uint8Array} 转换后的Uint8Array
   */
  _stringToUint8Array(str) {
    if (typeof TextEncoder !== 'undefined') {
      // 使用TextEncoder
      return new TextEncoder().encode(str);
    } else {
      // 降级到手动转换
      return new Uint8Array([...str].map(char => char.charCodeAt(0)));
    }
  }

  /**
   * 备用字符串转换方法
   * @private
   * @param {string} str - 要转换的字符串
   * @returns {Uint8Array} 转换后的Uint8Array
   */
  _stringToUint8ArrayFallback(str) {
    try {
      const codeUnits = [];
      for (let i = 0; i < str.length; i++) {
        codeUnits.push(str.charCodeAt(i));
      }
      return new Uint8Array(codeUnits);
    } catch (error) {
      console.error("备用字符串转换也失败:", error);
      // 最后的备用方案：返回空数组
      return new Uint8Array(0);
    }
  }
  /**
   * 显示Toast提示
   * @private
   * @param {string} message - 提示消息
   */
  _showToast(message) {
    try {
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 1500,
      })
    } catch (error) {
      console.log("Toast显示失败:", error);
      // 备用提示方法
      console.log(`[Toast] ${message}`);
    }
  }

  // MARK: - 控制命令
  /**
   * 验证密码
   * @param {string} password - 密码
   */
  verifyPassword(password) {
    console.log('verifyPassword11: ', this._firstPasswordVerified, this._passwordVerified);
    
    try {
      // 如果已经验证过密码，直接返回
      if (this._firstPasswordVerified && this._passwordVerified) { 
        this._showToast(this.t("password_verified"));
        return;
      }

      // 保存密码用于后续验证
      this.lastVerifyPassword = password;

      // 构建密码验证命令
      const command = Command.PASSWORD_PREFIX + password + Command.PASSWORD_SUFFIX;
      console.log('sand before command: ', command, command.length);
      
      // 发送密码验证命令并等待结果
      this.sendCommand(command, WritePriority.HIGH);
    } catch (error) {
      console.error('密码验证过程中发生错误:', error);
      this._showToast(this.t("password_error"));
      return false;
    }
  }

  /**
   * 修改密码
   * @param {string} newPassword - 新密码
   */
  async changePassword(newPassword) {
    const command = Command.PASSWORD_PREFIX + newPassword + Command.PASSWORD_SUFFIX;

    if (this._bluetoothWriter._writeCharacteristic === null || this._peripheral === null) {
      this._showToast(this.t("ble_not_ready"));
      return;
    }

    const data = this._stringToUint8Array(command);
    if (data.length === 0) {
      console.log("命令数据为空:", command);
      return;
    }

    console.log("入队命令:", command);
    let success = false;
    try {
      success = await this._bluetoothWriter.writeData({
        data: data,
        priority: WritePriority.NORMAL
      });

      if (success) {
        // 密码修改成功
        this._showToast(this.t("password_modified_success"));
      } else {
        this._showToast(this.t("password_error")); // 失败时显示提示
        console.log(`发送命令 '${command}' 失败: 写入操作失败`);
      }
    } catch (error) {
      console.error("修改密码失败:", error);
      this._showToast(this.t("password_error"));
    }
  }

  refreshDeviceInfo() {
    if (this._peripheral === null || !this.isConnected) {
      this.sendCommand("re");
      this._notifyListeners();
    }
  }
  startCharging() {
    if (this.guardPasswordVerified()) {
      this.sendCommand(Command.CHARGE_OPEN);
    }
  }
  stopCharging() {
    if (this.guardPasswordVerified()) {
      this.sendCommand(Command.CHARGE_CLOSE);
    }
  }
  startDischarging() {
    if (this.guardPasswordVerified()) {
      this.sendCommand(Command.DISCHARGE_OPEN);
    }
  }
  stopDischarging() {
    if (this.guardPasswordVerified()) {
      this.sendCommand(Command.DISCHARGE_CLOSE);
    }
  }

  async _sendControlCommand(type, {
    prefix,
    normalValue,
    integerValue,
    specialCommandValue,
    batteryTypeValue
  }) {
    console.log('_sendControlCommand: ', specialCommandValue);
    switch (type) {
      case CommandType.NORMAL_VALUE:
        if (prefix !== null && normalValue !== null) {
          const intValue = Math.floor(normalValue * 10);
          const highByte = (intValue >> 8) & 0xFF;
          const lowByte = intValue & 0xFF;
          command = `${prefix}=0x${highByte.toString(16).padStart(2, '0')},0x${lowByte.toString(16).padStart(2, '0')}\n`;
        }
        break;
      case CommandType.INTEGER_VALUE:
        if (prefix !== null && integerValue !== null) {
          const intValue = Math.floor(integerValue);
          const highByte = (intValue >> 8) & 0xFF;
          const lowByte = intValue & 0xFF;
          command = `${prefix}=0x${integerValue.toString(16).padStart(2, '0')}\n`;
        }
        break;
      case CommandType.SPECIAL_COMMAND:
        if (specialCommandValue !== null) {
          command = `${specialCommandValue}\n`;
        }
        break;
      case CommandType.BATTERY_TYPE:
        if (batteryTypeValue !== null) {
          command = `${batteryTypeValue}\n`;
        }
        break;
    }
    if (command === null) {
      console.log("命令生成失败");
      return;
    }
    this.sendCommand(command, WritePriority.HIGH);
  }

  setBalanceTemperature(temp) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "jhwd",
      normalValue: temp
    });
  }
  // 电池重置
  resetCurrent() {
    if (this.guardPasswordVerified()) {
      this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
        specialCommandValue: "dl0"
      });
    }
  }
  // 一键铁锂
  setFeLiBattery() {
    if (this.guardPasswordVerified()) {
      this._sendControlCommand(CommandType.BATTERY_TYPE, {
        batteryTypeValue: "okFe"
      });
    }
  }
  // 一键钛锂
  setTiLiBattery() {
    if (this.guardPasswordVerified()) {
      this._sendControlCommand(CommandType.BATTERY_TYPE, {
        batteryTypeValue: "okTi"
      });
    }
  }
  // 一键三元
  setSanyuanBattery() {
    if (this.guardPasswordVerified()) {
      this._sendControlCommand(CommandType.BATTERY_TYPE, {
        batteryTypeValue: "okCo"
      });
    }
  }
  // 过压保护
  setOverVoltageProtection(value) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "gybh",
      normalValue: value
    });
  }
  // 过压恢复
  setOverVoltageRecovery(value) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "gyhf",
      normalValue: value
    });
  }
  // 欠压保护
  setUnderVoltageProtection(value) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "qybh",
      normalValue: value
    });
  }
  // 探头高温
  setProbeHighTemperature(value) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "usgw",
      normalValue: value
    });
  }
  // 探头低温
  setMosHighTemperature(value) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "msgw",
      normalValue: value
    });
  }
  // 电压差
  setBalanceVoltageDiff(value) {
    this._sendControlCommand(CommandType.NORMAL_VALUE, {
      prefix: "jhyc",
      normalValue: value
    });
  }
  // 电流限制
  setCurrentLimit(value) {
    this._sendControlCommand(CommandType.INTEGER_VALUE, {
      prefix: "dqdl",
      integerValue: value
    });
  }
  // 过流保护
  setFaultDelay(value) {
    this._sendControlCommand(CommandType.INTEGER_VALUE, {
      prefix: "gyys",
      integerValue: value
    });
  }
  // 充电开启
  openCharge() {
    this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
      specialCommandValue: "cdopen"
    });
  }
  // 充电关闭
  closeCharge() {
    this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
      specialCommandValue: "cdclose"
    });
  }
  // 放电开启
  openDischarge() {
    this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
      specialCommandValue: "fdopen"
    });
  }
  // 放电关闭
  closeDischarge() {
    this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
      specialCommandValue: "fdclose"
    });
  }
  // 一键均衡
  startOneKeyBalance() {
    if (this.guardPasswordVerified()) {
      this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
        specialCommandValue: "okjh"
      });
    }
  }
  // 重启设备
  restartDevice() {
    if (this.guardPasswordVerified()) {
      this._sendControlCommand(CommandType.SPECIAL_COMMAND, {
        specialCommandValue: "restart"
      });
    }
  }
  // 读取参数
  readParameters() {
    this.sendCommand("read\n", WritePriority.LOW);
  }
  /**
   * 发送命令
   * @param {string} command - 命令字符串
   */
  async sendCommand(command, priority = WritePriority.NORMAL) {
    try {
      console.log('准备发送命令:', command);
      
      // 检查设备连接状态
      if (this._bluetoothWriter._writeCharacteristic === null || this._peripheral === null) {
        console.log("设备未连接，无法发送命令", this.t("ble_not_ready"));
        this._showToast(this.t("ble_not_ready"));
        return false;
      }

      // 转换命令为数据格式
      const data = this._stringToUint8Array(command);
      if (data.length === 0) {
        return false;
      }
      console.log("发送命令:", command, "数据长度:", data.length);

      // 使用BluetoothWriter发送命令
      // const success = await this._bluetoothWriter.writeData({
      //   data: data,
      //   priority: WritePriority.HIGH,
      // });
      
      // if (!command.startsWith("pswd=")) {
      //   console.log('this._stringToUint8Array(command): ', this._stringToUint8Array(command));
      //   console.log('_peripheral: ', this._peripheral);
      //   console.log('this._bluetoothWriter._writeCharacteristic: ', this._bluetoothWriter._writeCharacteristic);
      //   console.log('data: ', data);
        
      //   console.log('success: ', success, 'command123: ', command);
      // }
      const success = await this._bluetoothWriter.writeData({
        data: data,
        priority,
      });
      if (success) {
        console.log(`命令 '${command}' 发送成功`);
        
        // 对于非刷新命令，显示成功提示
        if (!command.startsWith("re")) {
          this._showToast(this.t("sent"));
        }
        return true;
      } else {
        console.log(`发送命令 '${command}' 失败: 写入操作失败`);
        this._showToast(this.t("command_send_failed"));
        return false;
      }
    } catch (error) {
      console.error(`发送命令 '${command}' 时发生错误:`, error);
      this._showToast(this.t("command_send_failed"));
      return false;
    }
  }

  async sendRawCommand(data) {
    if (this._bluetoothWriter._writeCharacteristic === null || this._peripheral === null) {
      console.log("设备未连接，无法发送命令");
      this._showToast(this.t("ble_not_ready"));
      return;
    }

    if (this.guardPasswordVerified()) {
      console.log("发送原始命令:", data);
      let success = await this._bluetoothWriter.writeData({
        data: data,
        priority: WritePriority.NORMAL
      });
      if (!success) {
        this._showToast(this.t("command_send_failed"));
      }
    }
  }

  _handlePasswordResponse(response) {
    console.log('_handlePasswordResponse: ', response);
    
    if (this._firstPasswordVerified) {
      if (response === PasswordResponse.SUCCESS) {
        if (!this._passwordVerified) {
          // 密码验证成功
          this._lastError = null;
          this._passwordVerified = true;
          this.verifiedPassword = this.lastVerifyPassword;

          // 启动密码验证定时器（4分钟后自动失效）
          this._startPasswordTimer();
  
          // 显示成功提示
          // this._showToast(`打印密码是否验证 ${this._passwordVerified}, 2 ${this._firstPasswordVerified}`);
          this._showToast(this.t("password_success"));
        }
      } else if (response === PasswordResponse.FAILURE) {
        // 密码验证失败
        this._passwordVerified = false;
        this._lastError = this.t("password_error");
        this.verifiedPassword = null;
        // 显示失败提示
        this._showToast(this.t("password_error"));
      } else {
        console.log('未知的密码响应类型:', response);
      }
    } else {
      // 这里逻辑需要优化
      this.verifyPassword(this.lastVerifyPassword);
      this._firstPasswordVerified = true;
    }
    
    // 通知所有监听器状态变化
    this._notifyListeners();
  }

  _startPasswordTimer() {
    this.cancelPasswordTimer();
    this._passwordTimer = setTimeout(() => {
      this._passwordVerified = false;
      this._notifyListeners();
    }, 240000)
  }

  _stopPasswordTime() {
    this.cancelPasswordTimer();
  }

  cancelPasswordTimer() {
    if (this._passwordTimer) {
      console.log('取消密码验证定时器');
      clearTimeout(this._passwordTimer);
      this._passwordTimer = null;
    }
  }

  _updateBatteryDataOnMain(key, value) {
    this._updateBatteryData(key, value);
    // this._batteryData.updateProperty(key, value);
    // this._batteryData.update();
    this._notifyListeners();
  }

  updateTotalStrings(count) {
    if (count <= 0 || count > 252) {
      return;
    }

    this._batteryData.totalStrings = count;
    const neededBytes = ((count + 5) / 6);
    this._batteryData.balanceStatus = new Array(neededBytes).fill(0);
    this._batteryData.voltages = new Array(count).fill(0.0); // 调整电压数组大小
    this._batteryData.updateMultiple({
      totalStrings: count,
      balanceStatus: new Array(neededBytes).fill(0),
      voltages: new Array(count).fill(0.0),
    })
    // this._batteryData.update();
    this._notifyListeners();
  }

  _updateStatus({
    chargingStatus,
    dischargingStatus,
    balancingStatus
  } = {}) {
    if (chargingStatus !== null) {
      this._batteryData.chargingStatus = chargingStatus;
      console.log("充电状态:", chargingStatus);
    }

    if (dischargingStatus !== null) {
      this._batteryData.dischargingStatus = dischargingStatus;
      console.log("放电状态:", dischargingStatus);
    }

    if (balancingStatus !== null) {
      this._batteryData.balancingStatus = balancingStatus;
      console.log("均衡状态:", balancingStatus);
    }

    // this._batteryData.update();
    this._batteryData.updateMultiple({
      chargingStatus,
      dischargingStatus,
      balancingStatus,
    });
    this._notifyListeners();
  }

  _parseLine(item) {
    // 按冒号分割
    const components = item.split(":");
    if (components.length === 2) {
      return {
        key: components[0].trim(),
        value: components[1].trim()
      };
    }

    // 按等号分割
    const equalComponents = item.split("=");
    if (equalComponents.length === 2) {
      return {
        key: equalComponents[0].trim(),
        value: equalComponents[1].trim()
      };
    }

    return null;
  }
  _updateBatteryData(key, value) {
    switch (key) {
      case 'zdy':
        this._batteryData.totalVoltage = parseFloat(value) || 0.0;
        break;
      case 'yc':
        this._batteryData.voltageDiff = parseFloat(value) || 0.0;
        break;
      case 'zd':
        this._batteryData.lowestString = parseInt(value) || 0;
        break;
      case 'min':
        this._batteryData.minVoltage = parseFloat(value) || 0.0;
        break;
      case 'zg':
        this._batteryData.highestString = parseInt(value) || 0;
        break;
      case 'max':
        this._batteryData.maxVoltage = parseFloat(value) || 0.0;
        break;
      case 'dl':
        this._batteryData.current = parseFloat(value) || 0.0;
        break;
      case 'gl':
        this._batteryData.power = parseFloat(value) || 0.0;
        break;
      case 'bl':
        this._batteryData.ratio = parseFloat(value) || 0.0;
        break;
      case 'rl':
        this._batteryData.capacity = parseFloat(value) || 0.0;
        break;
      case 'zx':
        this._batteryData.totalCapacity = parseFloat(value) || 0.0;
        break;
      case 'pj':
        this._batteryData.averageVoltage = parseFloat(value) || 0.0;
        break;
      case 'moswd':
        this._batteryData.mosTemperature = parseFloat(value) || 0.0;
        break;
      case 'jhwd':
        this._batteryData.balanceTemperature = parseFloat(value) || 0.0;
        break;
      case 'xpwd1':
        this._batteryData.chip1Temperature = parseFloat(value) || 0.0;
        break;
      case 'xpwd2':
        this._batteryData.chip2Temperature = parseFloat(value) || 0.0;
        break;
      case 'jhzt':
        // 处理均衡状态数据
        this._batteryData.balancingStatus = true;

        // 尝试按照协议解析均衡状态数据
        if (value.length >= 4) {
          // 创建临时字节数组
          const balanceBytes = new Array(Math.min(value.length, this._batteryData.balanceStatus.length)).fill(0);


          // 解析每个字符作为一个字节
          for (let i = 0; i < Math.min(value.length, this._batteryData.balanceStatus.length); i++) {
            // JavaScript charCodeAt给出ASCII值
            balanceBytes[i] = value.charCodeAt(i);
          }

          // 更新均衡状态数组
          for (let i = 0; i < balanceBytes.length; i++) {
            if (i < this._batteryData.balanceStatus.length) {
              this._batteryData.balanceStatus[i] = balanceBytes[i];
            }
          }

          // 调试输出
          const balancingStrings = this._batteryData.getBalancingStrings(); // 使用BatteryData自己的getter
          console.log("均衡中的电池串:", balancingStrings);

          const hexString = balanceBytes
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
          console.log("均衡状态字节 (hex):", hexString);

          const binaryString = balanceBytes.map(b => {
            let binStr = '';
            for (let bit = 7; bit >= 0; bit--) {
              // 从MSB到LSB迭代，用于标准二进制字符串
              binStr += ((b >> bit) & 1).toString();
            }
            return binStr;
          }).join(' ');
          console.log("均衡状态二进制:", binaryString);
        }
        break;
      default:
        // 处理温度数据 u1-u4
        if (key.startsWith("u") && key.length > 1) {
          const index = parseInt(key.substring(1));
          const temp = parseFloat(value);
          if (!isNaN(index) && !isNaN(temp)) {
            // 确保数组长度足够
            while (this._batteryData.temperatures.length < index) {
              this._batteryData.temperatures.push(0.0);
            }
            this._batteryData.temperatures[index - 1] = temp;
          }
        }
        // 处理电池电压数据 1-24
        else if (!isNaN(parseInt(key))) {
          const index = parseInt(key);
          const voltage = parseFloat(value);
          if (!isNaN(index) && !isNaN(voltage)) {
            // 确保数组有足够的容量
            while (this._batteryData.voltages.length < index) {
              this._batteryData.voltages.push(0.0);
            }
            this._batteryData.voltages[index - 1] = voltage;
          }
        }
        break;
    }
  }

  _handleCdCloseStatus(statusString) {
    // 去除右侧空格
    statusString = statusString.trimEnd();

    if (!statusString.startsWith("cdclose") || statusString.length <= 7) {
      return;
    }

    const charIndex = statusString.charCodeAt(7);
    const statusValue = charIndex;
    let statusText = "";

    console.log(`解析cdclose状态码: ${statusValue} (0x${statusValue.toString(16).padStart(2, '0')})`);
    if ((statusValue & 0x80) !== 0) {
      statusText = this.t("short_circuit_protection") || '短路保护';
    } else if ((statusValue & 0x01) !== 0) {
      statusText = this.t("single_under_voltage") || '单体欠压';
    } else if ((statusValue & 0x02) !== 0) {
      statusText = this.t("manual_close") || '手动关闭';
    } else if ((statusValue & 0x04) !== 0) {
      statusText = this.t("mos_high_temp") || 'MOS高温';
    } else if ((statusValue & 0x08) !== 0) {
      statusText = this.t("probe_high_temp") || '探头高温';
    } else if ((statusValue & 0x10) !== 0) {
      statusText = this.t("string_drop") || '串数脱落';
    } else if ((statusValue & 0x40) !== 0) {
      statusText = this.t("over_current_protection") || '过流保护';
    } else if ((statusValue & 0x20) !== 0) {
      statusText = this.t("delay_recovery") || '延时恢复';
    } else {
      statusText = ""; // 未知或正常状态
    }
    console.log(`设备状态: ${statusText || "正常"}`);
    if (statusString.length > 8) {
      // 假设延时时间从第9个字符开始，格式为数字字符串
      const delayStr = statusString.substring(8);
      const delayTimeSeconds = parseInt(delayStr) || 0;

      if (delayTimeSeconds > 0) {
        this._batteryData.gzys = delayTimeSeconds;
        this.startGZYSTimer();
      }
      console.log(`解析延时时间: ${delayTimeSeconds} 秒`);
    }

    this._cdCloseStatusText = statusText;
    this._notifyListeners();
  }

  _handleFdCloseStatus(statusString) {
    statusString = statusString.trimEnd();
    if (!statusString.startsWith("fdclose") || statusString.length <= 7) {
      return;
    }

    const charIndex = statusString.charCodeAt(7);
    const statusValue = charIndex;
    var statusText = "";
    console.log(`解析fdclose状态码: ${statusValue} (0x${statusValue.toString(16).padStart(2, '0')})`);

    if ((statusValue & 0x80) !== 0) {
      statusText = this.t("short_circuit_protection") || '短路保护';
    } else if ((statusValue & 0x01) !== 0) {
      statusText = this.t("single_under_voltage") || '单体欠压';
    } else if ((statusValue & 0x02) !== 0) {
      statusText = this.t("manual_close") || '手动关闭';
    } else if ((statusValue & 0x04) !== 0) {
      statusText = this.t("mos_high_temp") || 'MOS高温';
    } else if ((statusValue & 0x08) !== 0) {
      statusText = this.t("probe_high_temp") || '探头高温';
    } else if ((statusValue & 0x10) !== 0) {
      statusText = this.t("string_drop") || '串数脱落';
    } else if ((statusValue & 0x40) !== 0) {
      statusText = this.t("over_current_protection") || '过流保护';
    } else if ((statusValue & 0x20) !== 0) {
      statusText = this.t("delay_recovery") || '延时恢复';
    } else {
      statusText = ""; // 未知或正常状态
    }
    if (statusString.length > 8) {
      // 假设延时时间从第9个字符开始，格式为数字字符串
      const delayStr = statusString.substring(8);
      const delayTimeSeconds = parseInt(delayStr) || 0;

      if (delayTimeSeconds > 0) {
        this._batteryData.gzys = delayTimeSeconds;
        this.startGZYSTimer();
      }
      console.log(`解析延时时间: ${delayTimeSeconds} 秒`);
    }

    console.log(`设备状态: ${statusText === "" ? "正常" : statusText}`);
    this._fdCloseStatusText = statusText;
    this._notifyListeners();
  }

  clearCdDeviceStatus() {
    this._cdCloseStatusText = "";
    this._notifyListeners();
  }

  clearFdDeviceStatus() {
    this._fdCloseStatusText = "";
    this._notifyListeners();
  }
  isBalancing(stringIndex) {
    if (stringIndex < 0 || stringIndex >= this._batteryData.totalStrings) {
      return false;
    }
    const byteIndex = Math.floor(stringIndex / 6);
    const bitPosition = stringIndex % 6;
    const bitIndex = 1 << bitPosition;

    if (byteIndex >= this._batteryData.balanceStatus.length) {
      return false;
    }
    return ((this._batteryData.balanceStatus[byteIndex] & bitIndex) !== 0);
  }

  getBalancingStrings() {
    const balancingStrings = [];
    for (let i = 0; i < this._batteryData.totalStrings; i++) {
      if (this.isBalancing(i)) {
        balancingStrings.push(i + 1);
      }
    }
    return balancingStrings;
  }

  // _handleReceivedData(data) {
  //   const string = String.fromCharCode(...data);
  //   this._receiveBuffer += string;

  //   if (this._receiveBuffer.includes("\n")) {
  //     const components = this._receiveBuffer.split("\n");
  //     for (let i = 0; i < components.length - 1; i++) {
  //       let completePacket = components[i];
  //       this._processReceivedData(completePacket);
  //     }

  //     if (this._receiveBuffer.endsWith("\n")) {
  //       const lastComponent = components[components.length - 1];
  //       if (lastComponent && lastComponent.trim().length > 0) {
  //         this._processReceivedData(lastComponent);
  //       }
  //       this._receiveBuffer = "";
  //     } else {
  //       this._receiveBuffer = components[components.length - 1];
  //       this._startProcessingTimer();
  //     }
  //   } else {
  //     this._startProcessingTimer();
  //   }
  // }

  guardPasswordVerified() {
    if (!this._passwordVerified) {
      this._showToast(this.t("please_verify_password"));
      console.log('密码未验证，请先验证密码');
      return false;
    }
    console.log('密码已验证，允许执行操作');
    return true;
  }

  startGzysTimer() {
    this.stopGZYSTimer();
    this.gzysTimer = setInterval(() => {
      console.log(`延迟定时器: ${this._batteryData.gzys}`);

      if (this._batteryData.gzys <= 0) {
        this.stopGZYSTimer();
        return;
      } else {
        this._batteryData.gzys = this._batteryData.gzys - 1;
        this._batteryData.updateProperty('gzys', this._batteryData.gzys);
        // this._batteryData.update();
        this._notifyListeners();
      }
    }, 1000);
  }

  /**
   * 处理蓝牙错误
   * @param {Object} error - 错误对象
   * @private
   */
  _handleBluetoothInitError(error) {
    console.error('蓝牙错误:', error);

    // 根据错误码处理不同情况
    if (error.errCode === 10001) {
      this._lastError = "当前蓝牙适配器不可用";
    } else if (error.errCode === 10009) {
      this._lastError = "当前蓝牙适配器不可用";
    } else if (error.errMsg && error.errMsg.includes('auth deny')) {
      this._lastError = "请授权蓝牙权限";
    } else {
      this._lastError = error.errMsg || "蓝牙操作失败";
    }

    this._notifyListeners();
  }
}

export default new BLEManager();