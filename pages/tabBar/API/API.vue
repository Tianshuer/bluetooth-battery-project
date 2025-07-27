<template>
    <view class="container">
        <view class="header">
            <text class="title">蓝牙设备控制</text>
        </view>
        
        <!-- 蓝牙开关控制 -->
        <view class="control-section">
            <view class="control-item">
                <text class="control-label">蓝牙状态</text>
                <switch :checked="bluetoothEnabled" @change="toggleBluetooth" />
            </view>
        </view>
        
        <!-- 设备扫描 -->
        <view class="control-section">
            <view class="section-header">
                <text class="section-title">设备扫描</text>
                <button class="scan-btn" @click="startScan" :disabled="scanning">
                    {{ scanning ? '扫描中...' : '开始扫描' }}
                </button>
            </view>
            
            <view v-if="devices.length === 0 && !scanning" class="empty-state">
                <text class="empty-text">暂无发现设备</text>
            </view>
            
            <!-- 设备列表 -->
            <view v-for="(device, index) in devices" :key="device.deviceId" class="device-item">
                <view class="device-info">
                    <text class="device-name">{{ device.name || '未知设备' }}</text>
                    <text class="device-id">{{ device.deviceId }}</text>
                </view>
                <view class="device-actions">
                    <button class="connect-btn" @click="connectDevice(device)" v-if="!device.connected">
                        连接
                    </button>
                    <button class="disconnect-btn" @click="disconnectDevice(device)" v-else>
                        断开
                    </button>
                </view>
            </view>
        </view>
        
        <!-- 已连接设备控制 -->
        <view class="control-section" v-if="connectedDevice">
            <view class="section-header">
                <text class="section-title">设备控制</text>
            </view>
            
            <view class="connected-device">
                <view class="device-info">
                    <text class="device-name">{{ connectedDevice.name }}</text>
                    <view class="battery-info">
                        <text class="battery-label">电池电量：</text>
                        <text class="battery-value">{{ batteryLevel }}%</text>
                    </view>
                </view>
                
                <view class="control-buttons">
                    <button class="control-btn" @click="getBatteryLevel">刷新电量</button>
                    <button class="control-btn" @click="sendCommand('power_on')">开机</button>
                    <button class="control-btn" @click="sendCommand('power_off')">关机</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        props: {
            hasLeftWin: {
                type: Boolean,
                default: false
            },
            leftWinActive: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                bluetoothEnabled: false,
                scanning: false,
                devices: [],
                connectedDevice: null,
                batteryLevel: 0
            };
        },
        onLoad() {
            this.initBluetooth();
        },
        onShow() {
            this.checkBluetoothState();
        },
        methods: {
            // 初始化蓝牙
            initBluetooth() {
                uni.openBluetoothAdapter({
                    success: (res) => {
                        console.log('蓝牙初始化成功', res);
                        this.bluetoothEnabled = true;
                        this.checkBluetoothState();
                    },
                    fail: (err) => {
                        console.log('蓝牙初始化失败', err);
                        this.bluetoothEnabled = false;
                    }
                });
            },
            
            // 检查蓝牙状态
            checkBluetoothState() {
                uni.getBluetoothAdapterState({
                    success: (res) => {
                        this.bluetoothEnabled = res.available;
                    }
                });
            },
            
            // 切换蓝牙开关
            toggleBluetooth(e) {
                if (e.detail.value) {
                    this.initBluetooth();
                } else {
                    uni.closeBluetoothAdapter({
                        success: () => {
                            this.bluetoothEnabled = false;
                            this.devices = [];
                            this.connectedDevice = null;
                        }
                    });
                }
            },
            
            // 开始扫描设备
            startScan() {
                if (!this.bluetoothEnabled) {
                    uni.showToast({
                        title: '请先开启蓝牙',
                        icon: 'none'
                    });
                    return;
                }
                
                this.scanning = true;
                this.devices = [];
                
                uni.startBluetoothDevicesDiscovery({
                    success: () => {
                        console.log('开始扫描设备');
                        this.getBluetoothDevices();
                        
                        // 10秒后停止扫描
                        setTimeout(() => {
                            this.stopScan();
                        }, 10000);
                    },
                    fail: (err) => {
                        console.log('扫描失败', err);
                        this.scanning = false;
                        uni.showToast({
                            title: '扫描失败',
                            icon: 'none'
                        });
                    }
                });
            },
            
            // 获取扫描到的设备
            getBluetoothDevices() {
                uni.getBluetoothDevices({
                    success: (res) => {
                        this.devices = res.devices.map(device => ({
                            ...device,
                            connected: false
                        }));
                    }
                });
            },
            
            // 停止扫描
            stopScan() {
                uni.stopBluetoothDevicesDiscovery({
                    success: () => {
                        this.scanning = false;
                        console.log('停止扫描');
                    }
                });
            },
            
            // 连接设备
            connectDevice(device) {
                uni.showLoading({
                    title: '连接中...'
                });
                
                // 这里应该实现具体的设备连接逻辑
                setTimeout(() => {
                    uni.hideLoading();
                    device.connected = true;
                    this.connectedDevice = device;
                    this.getBatteryLevel();
                    
                    uni.showToast({
                        title: '连接成功',
                        icon: 'success'
                    });
                }, 2000);
            },
            
            // 断开设备
            disconnectDevice(device) {
                device.connected = false;
                if (this.connectedDevice && this.connectedDevice.deviceId === device.deviceId) {
                    this.connectedDevice = null;
                    this.batteryLevel = 0;
                }
                
                uni.showToast({
                    title: '已断开连接',
                    icon: 'success'
                });
            },
            
            // 获取电池电量
            getBatteryLevel() {
                if (!this.connectedDevice) return;
                
                // 模拟获取电池电量
                uni.showLoading({
                    title: '获取电量中...'
                });
                
                setTimeout(() => {
                    uni.hideLoading();
                    this.batteryLevel = Math.floor(Math.random() * 100);
                }, 1000);
            },
            
            // 发送控制命令
            sendCommand(command) {
                if (!this.connectedDevice) {
                    uni.showToast({
                        title: '请先连接设备',
                        icon: 'none'
                    });
                    return;
                }
                
                uni.showLoading({
                    title: '执行命令中...'
                });
                
                setTimeout(() => {
                    uni.hideLoading();
                    uni.showToast({
                        title: '命令执行成功',
                        icon: 'success'
                    });
                }, 1000);
            }
        }
    };
</script>

<style scoped>
    .container {
        background-color: #f8f8f8;
        min-height: 100vh;
    }
    
    .header {
        padding: 40rpx 30rpx 20rpx;
        background-color: #007aff;
    }
    
    .title {
        font-size: 36rpx;
        font-weight: bold;
        color: #ffffff;
    }
    
    .control-section {
        margin: 20rpx;
        background-color: #ffffff;
        border-radius: 12rpx;
        padding: 30rpx;
    }
    
    .control-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .control-label {
        font-size: 32rpx;
        color: #333333;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
    }
    
    .section-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
    }
    
    .scan-btn {
        background-color: #007aff;
        color: #ffffff;
        font-size: 28rpx;
        padding: 15rpx 30rpx;
        border-radius: 8rpx;
        border: none;
    }
    
    .empty-state {
        padding: 60rpx 0;
        text-align: center;
    }
    
    .empty-text {
        font-size: 28rpx;
        color: #999999;
    }
    
    .device-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .device-info {
        flex: 1;
    }
    
    .device-name {
        font-size: 30rpx;
        color: #333333;
        font-weight: bold;
        display: block;
        margin-bottom: 8rpx;
    }
    
    .device-id {
        font-size: 24rpx;
        color: #999999;
    }
    
    .device-actions {
        margin-left: 20rpx;
    }
    
    .connect-btn {
        background-color: #52c41a;
        color: #ffffff;
        font-size: 26rpx;
        padding: 12rpx 24rpx;
        border-radius: 6rpx;
        border: none;
    }
    
    .disconnect-btn {
        background-color: #ff4d4f;
        color: #ffffff;
        font-size: 26rpx;
        padding: 12rpx 24rpx;
        border-radius: 6rpx;
        border: none;
    }
    
    .connected-device {
        padding: 20rpx;
        background-color: #f6ffed;
        border-radius: 8rpx;
        border: 1px solid #b7eb8f;
    }
    
    .battery-info {
        display: flex;
        align-items: center;
        margin-top: 15rpx;
    }
    
    .battery-label {
        font-size: 28rpx;
        color: #666666;
    }
    
    .battery-value {
        font-size: 32rpx;
        font-weight: bold;
        color: #52c41a;
        margin-left: 10rpx;
    }
    
    .control-buttons {
        display: flex;
        flex-wrap: wrap;
        margin-top: 30rpx;
        gap: 15rpx;
    }
    
    .control-btn {
        background-color: #007aff;
        color: #ffffff;
        font-size: 26rpx;
        padding: 15rpx 25rpx;
        border-radius: 6rpx;
        border: none;
        flex: 1;
        min-width: 0;
    }
</style> 