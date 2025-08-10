<template>
	<!-- 蓝牙设备列表半弹窗 -->
	<uni-popup ref="popup" type="bottom" :is-mask-click="false" :safe-area="false">
		<view class="popup-content">
			<view class="popup-header">
				<view class="popup-title-wrapper">
					<text class="popup-title">{{ t('found_peripherals', deviceList.length) }}</text>
				</view>
				<text class="popup-close" @click="hidePopup">×</text>
			</view>
			<view class="popup-body">
				<!-- 设备列表 -->
				<scroll-view class="device-list" scroll-y="true">
					<view 
						class="device-item" 
						v-for="(device, index) in deviceList" 
						:key="index"
						@click="selectDevice(device)"
					>
						<view class="device-icon">
							<view class="bluetooth-icon">
								<text class="iconfont icon-lanya"></text>
							</view>
						</view>
						<view class="device-info">
							<text class="device-name">{{device.name || t('unknown_device')}}</text>
							<text class="device-uuid">{{device.deviceId}}</text>
						</view>
					</view>
					
					<!-- 空状态 -->
					<view v-if="deviceList.length === 0 && !isScanning" class="empty-state">
						<text class="empty-text">{{ t('no_devices_found') }}</text>
					</view>
				</scroll-view>
				
				<!-- 底部按钮 -->
				<view class="popup-actions">
					<button class="action-btn stop-btn" @click="stopScan()">{{ t('stop_scan') }}</button>
					<button class="action-btn start-btn" @click="startScan()">{{ t('start_scan') }}</button>
				</view>
			</view>
		</view>
	</uni-popup>
</template>

<script>
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
import { mapGetters, mapActions } from 'vuex'
// import { handleBluetoothError } from '../utils/handleBluetoothError'
import bluetoothDataManager from '../utils/bluetoothDataManager'
import bleManager from '../utils/batteryManager';
export default {
	name: 'BluetoothList',
	components: {
		uniPopup
	},
	data() {
		return {
			deviceList: [],
			isScanning: false,
			bluetoothAdapter: null,
			scanTimer: null,
			dataReadingTimer: null,
			deviceUpdateTimer: null,
			notifyEnabledMap: new Map(), // 记录notify启用状态
			retryCountMap: new Map(), // 记录重试次数
			maxRetryCount: 3, // 最大重试次数
			showDebugInfo: false, // 控制调试信息显示
		}
	},
	computed: {
		...mapGetters([
			't',
			'isConnected',
			'discoveredPeripherals',
		]),
	},
	methods: {
		...mapActions([
			'setConnectionStatus',
			'updateBluetoothData',
			'setBluetoothDevice',
			'resetBluetoothData',
			'updateConnectionStatus',
		]),
	
		// 显示弹窗
		showPopup() {
			uni.hideTabBar({
				animation: true
			})
			// 重置状态
			this.deviceList = [];
			this.isScanning = false;
			
			// 打开弹窗
			this.$refs.popup.open();
			
			// 延迟开始扫描，确保弹窗完全打开
			setTimeout(() => {
				this.startScan();
			}, 300);
		},

		// 隐藏弹窗
		hidePopup() {
			// 先停止扫描
			this.stopScan(false);
			
			// 移除BLEManager监听器
			this.removeBleManagerListener();
			
			// 显示tabbar
			uni.showTabBar({
				animation: true
			})
			
			// 关闭弹窗
			this.$refs.popup.close();
		},
		
		// 开始扫描
		async startScan() {
			if (this.isScanning) return;
			// 先停止之前的扫描
			this.stopScan(false);
			// 清空设备列表
			this.deviceList = [];
			// this.isScanning = true;
			
			// 添加BLEManager状态监听器
			this.addBleManagerListener();
			
			uni.showToast({
				title: this.t('loading'),
				icon: 'loading',
				duration: 3000,
				mask: true,
			});
			await bleManager.startScanning();

			setTimeout(async () => {
				await bleManager.stopScanning();
			}, 10000);
		},
		
		// 添加BLEManager状态监听器
		addBleManagerListener() {
			// 移除之前的监听器（如果存在）
			this.removeBleManagerListener();
			
			// 监听全局连接状态事件
			this.connectionStatusListener = (connectionData) => {
				console.log('BluetoothList收到连接状态更新:', connectionData);
				this.updateConnectionStatus(connectionData);
			};
			uni.$on('bleConnectionStatusChanged', this.connectionStatusListener);
			
			// 添加新的监听器
			this.bleManagerListener = (stateData) => {
				console.log('BluetoothList收到BLEManager状态更新:', stateData);
				console.log('更新时间:', new Date().toLocaleTimeString());
				
				// 更新扫描状态
				// this.isScanning = stateData.isScanning;
				
				// 更新设备列表
				if (stateData.discoveredPeripherals && Array.isArray(stateData.discoveredPeripherals)) {
					this.deviceList = stateData.discoveredPeripherals;
				}
				
				// 更新Vuex store中的连接状态和版本号
				this.updateConnectionStatus({
					isConnected: stateData.isConnected,
					deviceId: stateData.deviceId,
					deviceName: stateData.deviceName,
					versionName: stateData.versionName
				});
				
				// 发送batteryData到全局事件
				if (stateData.batteryData) {
					console.log('发送batteryData到全局事件:', stateData.batteryData);
					console.log('发送时间:', new Date().toLocaleTimeString());
					uni.$emit('batteryDataChanged', stateData.batteryData);
				}
			};
			
			// 注册监听器
			bleManager.addListener(this.bleManagerListener);
			console.log('BLEManager监听器已注册');
			
			// 立即获取当前状态
			this.bleManagerListener({
				isScanning: bleManager.isScanning,
				discoveredPeripherals: bleManager.discoveredPeripherals
			});
		},
		
		// 移除BLEManager状态监听器
		removeBleManagerListener() {
			if (this.bleManagerListener) {
				bleManager.removeListener(this.bleManagerListener);
				this.bleManagerListener = null;
			}
			
			// 移除全局连接状态监听器
			if (this.connectionStatusListener) {
				uni.$off('bleConnectionStatusChanged', this.connectionStatusListener);
				this.connectionStatusListener = null;
			}
		},
		
		// 停止扫描
		async stopScan(isShowToast = true) {
			this.isScanning = false;

			// 清除扫描定时器
			if (this.scanTimer) {
				clearTimeout(this.scanTimer);
				this.scanTimer = null;
			}
			
			// 停止搜索蓝牙设备
			await bleManager.stopScanning();
						
			if (isShowToast) {
				uni.showToast({
					title: this.t('stop_scan'),
					icon: 'none',
				});
			}
		},
		
		// 选择设备
		async selectDevice(device) {
			uni.showToast({
				title: this.t('connecting'),
				icon: 'loading',
				duration: 2000,
				mask: true,
			});
			
			// 连接蓝牙设备
			await this.connectToDevice(device);
		},
		
		// 连接到设备
		async connectToDevice(device) {
			console.log('device: ', device);
			
			try {
				// 使用BLEManager连接设备
				await bleManager.connect(device);
				
				// 设置设备信息到store
				this.setBluetoothDevice({
					deviceId: device.deviceId,
					name: device.name
				});
				
				// 设置连接状态
				this.setConnectionStatus(true);
				
				console.log('设备连接成功，准备跳转页面');
				
				// 延迟跳转页面
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/tabBar/component/component',
						success: () => {
							console.log('页面跳转成功');
						},
						fail: (err) => {
							console.error('页面跳转失败:', err);
							// 尝试使用navigateTo作为备用方案
							uni.navigateTo({
								url: '/pages/tabBar/component/component',
								success: () => {
									console.log('使用navigateTo跳转成功');
								},
								fail: (navErr) => {
									console.error('navigateTo也失败:', navErr);
								}
							});
						}
					});
				}, 200);
				
				// 先隐藏弹窗，再跳转页面
				this.hidePopup();
			} catch (error) {
				console.error('连接设备失败:', error);
				
				this.setConnectionStatus(false);
				uni.showToast({
					title: this.t('failed_to_connect_to_device'),
					icon: 'none',
					duration: 2000,
					mask: true,
				});
				
				// 触发连接失败事件
				this.$emit('connection-failed');
			}
		},
		 // 清理notify状态
		clearNotifyStatus() {
			this.notifyEnabledMap.clear();
			this.retryCountMap.clear();
		},
	},
	onShow() {
		// 页面显示时重新获取状态
		this.updateBleManagerState();
	},
	// 组件销毁时清理资源
	beforeDestroy() {
		// 组件销毁时清理监听器
		console.log('组件销毁，清理蓝牙资源');
		this.stopScan(false);
		
		// 移除BLEManager监听器
		this.removeBleManagerListener();
		
		// 清理数据读取定时器
		if (this.dataReadingTimer) {
			clearInterval(this.dataReadingTimer);
			this.dataReadingTimer = null;
		}
		
		this.clearNotifyStatus();
	}
}
</script>

<style>
/* 弹窗样式 */
.popup-content {
	background: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	padding: 20rpx 20rpx 80rpx;
	min-height: 75vh;
	max-height: 75vh;
	display: flex;
	flex-direction: column;
	position: relative;
	z-index: 9999;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid #f0f0f0;
  position: relative;
  min-height: 80rpx;
}
.popup-title-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-title {
	font-size: 28rpx;
	color: #333333;
}

.popup-close {
  font-size: 40rpx;
  color: #999999;
  cursor: pointer;
  width: 56rpx;
  height: 56rpx;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
  transition: background 0.2s;
}

.popup-close:active {
  background: #e0e0e0;
}

.popup-body {
	display: flex;
	flex-direction: column;
	flex: 1;
}

/* 设备列表样式 */
.device-list {
	flex: 1;
	margin-bottom: 30rpx;
	max-height: 64vh;
}

.device-item {
	display: flex;
	align-items: center;
	padding: 20rpx;
	margin-bottom: 10rpx;
}

.device-item:active {
	background: #e9ecef;
	transform: scale(0.98);
}

.device-icon {
	margin-right: 20rpx;
}

.bluetooth-icon {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
}

.bluetooth-icon .iconfont {
	color: #007AFF;
	font-size: 48rpx;
	font-weight: 600;
}

.device-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.device-name {
	font-size: 32rpx;
	color: #333333;
	margin-bottom: 8rpx;
	font-weight: 500;
}

.device-uuid {
	font-size: 28rpx;
	color: #666666;
	margin-bottom: 4rpx;
}

/* 空状态样式 */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-text {
	font-size: 32rpx;
	color: #666666;
	text-align: center;
}

/* 底部按钮样式 */
.popup-actions {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
	margin-bottom: 0;
}

.action-btn {
	width: 200rpx;
	height: 78rpx;
	line-height: 78rpx;
	border: none;
	border-radius: 16rpx;
	font-size: 28rpx;
	font-weight: 500;
	transition: all 0.3s ease;
}

.stop-btn {
	background: #acc890;
	color: #ffffff;
}

.start-btn {
	background: #acc890;
	color: #ffffff;
}

/* 确保弹窗覆盖tabbar */
/* 使用 /deep/ 语法 */
.uni-popup {
    z-index: 9999 !important;
}

.uni-popup__mask {
    z-index: 9998 !important;
}

.uni-popup__wrapper {
    z-index: 9999 !important;
}
</style> 