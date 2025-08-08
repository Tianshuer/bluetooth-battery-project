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
					<button class="action-btn stop-btn" @click="stopScan" :disabled="!isScanning">{{ t('stop_scan') }}</button>
					<button class="action-btn start-btn" @click="startScan" :disabled="isScanning">{{ t('start_scan') }}</button>
				</view>
			</view>
		</view>
	</uni-popup>
</template>

<script>
import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
import { mapGetters, mapActions } from 'vuex'
import { handleBluetoothError } from '../utils/handleBluetoothError'
import bluetoothDataManager from '../utils/bluetoothDataManager'

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
			maxRetryCount: 3 // 最大重试次数
		}
	},
	computed: {
		...mapGetters([
			't',
			'isConnected',
		])
	},
	methods: {
		...mapActions([
			'setConnectionStatus',
			'updateBluetoothData',
			'setBluetoothDevice',
			'resetBluetoothData'
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
			this.stopScan();
			
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
			this.stopScan();
			
			// 清空设备列表
			this.deviceList = [];
			this.isScanning = true;
			
			uni.showToast({
				title: this.t('loading'),
				icon: 'loading',
				duration: 3000,
			});
			try {
				// 开始搜索蓝牙设备
				this.startBluetoothDevicesDiscovery();
				
				uni.onBluetoothDeviceFound(this.handleBluetoothDeviceFound);
				
				this.deviceUpdateTimer = setTimeout(() => {
					if (this.isScanning && this.deviceList.length === 0) {
						// 3秒内没有发现设备，隐藏toast
						uni.hideToast();
					}
				}, 3000);
				// 设置扫描超时（30秒后自动停止）
				this.scanTimer = setTimeout(() => {
					if (this.isScanning) {
						this.stopScan();
					}
				}, 3000);
				
			} catch (error) {
				this.isScanning = false;
				console.error('开始扫描失败:', error);
			}
		},
		
		// 开始搜索蓝牙设备
		startBluetoothDevicesDiscovery() {
			uni.startBluetoothDevicesDiscovery({
				success: () => {},
				fail: (err) => {
					handleBluetoothError(err);
					this.isScanning = false;
				}
			});
			
		},
		
		// 监听蓝牙设备发现事件
		handleBluetoothDeviceFound(res) {
			if (res.devices && res.devices.length > 0) {
				res.devices.forEach(device => {
					const existingDevice = this.deviceList.find(item => item.deviceId === device.deviceId);
					if (!existingDevice && device.name !== '未知设备') {
						this.deviceList.push({
							name: device.name || '未知设备',
							deviceId: device.deviceId,
							advertisData: device.advertisData,
							advertisServiceUUIDs: device.advertisServiceUUIDs,
							localName: device.localName,
							serviceData: device.serviceData
						});
						// 发现设备后，清除3秒检查定时器（因为已经有设备了）
						if (this.deviceUpdateTimer) {
							clearTimeout(this.deviceUpdateTimer);
							this.deviceUpdateTimer = null;
						}
					}
				});
			}
		},
		
		// 停止扫描
		stopScan() {
			if (!this.isScanning) return;
			this.isScanning = false;
			
			// 清除扫描定时器
			if (this.scanTimer) {
				clearTimeout(this.scanTimer);
				this.scanTimer = null;
			}
			
			// 停止搜索蓝牙设备
			uni.stopBluetoothDevicesDiscovery();
			
			uni.showToast({
				title: this.t('stop_scan'),
				icon: 'none',
			});
		},
		
		// 选择设备
		selectDevice(device) {
			uni.showToast({
				title: this.t('connecting'),
				icon: 'loading',
				duration: 2000
			});
			
			// 停止扫描
			this.stopScan();
			
			// 连接蓝牙设备
			this.connectToDevice(device);
		},
		
		// 连接到设备
		async connectToDevice(device) {
			console.log('device: ', device);
			// console.log('advertisData: ', ab2hex(device.advertisData));
			
			try {
				// 使用蓝牙数据管理器连接设备
				await bluetoothDataManager.connectDevice(device.deviceId);
				
				// 设置设备信息到store
				this.setBluetoothDevice({
					deviceId: device.deviceId,
					name: device.name
				});
				
				// 获取设备的服务
				const services = await bluetoothDataManager.getDeviceServices(device.deviceId);
				console.log('services: ', services);

				let foundAny = false;
				
				if (services && services.length > 0) {
					for (const service of services) {
						// 获取第一个服务的特征值
						const characteristics = await bluetoothDataManager.getDeviceCharacteristics(
							device.deviceId, 
							service.uuid
						);
						console.log('characteristics: ', characteristics);
						
						if (characteristics && characteristics.length > 0) {
							for(const char of characteristics) {
								if (char.properties.notify || char.properties.indicate) {
									await this.enableNotify(device.deviceId, service.uuid, char.uuid);
									bluetoothDataManager.onCharacteristicValueChange((data) => {
										if (data) {
										console.log('收到蓝牙数据:', data);
										this.updateBluetoothData(data);
										}
									});
									bluetoothDataManager.setDeviceInfo(
										device.deviceId,
										service.uuid,
										char.uuid
									);
									this.setBluetoothDevice({
										serviceId: service.uuid,
										characteristicId: char.uuid
									});
									this.setConnectionStatus(true);
									foundAny = true;
									// 不 break/return/continue，继续遍历
								}
								if (char.properties.read) {
									bluetoothDataManager.setDeviceInfo(
										device.deviceId,
										service.uuid,
										char.uuid
									);
									this.setBluetoothDevice({
										serviceId: service.uuid,
										characteristicId: char.uuid
									});
									this.startDataReading(device.deviceId, service.uuid, char.uuid);
									this.setConnectionStatus(true);
									foundAny = true;
									// 不 break/return/continue，继续遍历
								}
							}
						}
					};
				}
				if (!foundAny) {
					throw new Error('没有找到支持notify/indicate或read的特征值');
				}
				// 延迟跳转页面
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/tabBar/component/component'
					});
				}, 1500);
				this.hidePopup();
			} catch (error) {
				console.error('连接设备失败:', error);
				handleBluetoothError(error);
				
				this.setConnectionStatus(false);
				uni.showToast({
					title: this.t('failed_to_connect_to_device'),
					icon: 'none',
					duration: 2000
				});
				
				// 触发连接失败事件
				this.$emit('connection-failed');
			}
		},

		// 开始定期读取数据
		startDataReading(deviceId, serviceId, characteristicId) {
			console.log(deviceId, serviceId, characteristicId);
			
			// 立即读取一次
			this.readBLECharacteristicValue(deviceId, serviceId, characteristicId)
				.catch(error => {
					console.warn('首次读取失败，将在定时器中继续尝试', error);
				});
			
			// 设置定期读取定时器（每2秒读取一次）
			this.dataReadingTimer = setInterval(() => {
				if (this.isConnected) {
					this.readBLECharacteristicValue(deviceId, serviceId, characteristicId)
						.catch(error => {
							console.warn('首次读取失败，将在定时器中继续尝试', error);
						});
				} else {
					this.stopDataReading();
				}
			}, 2000);
		},
		 // 停止数据读取
		 stopDataReading() {
			if (this.dataReadingTimer) {
				clearInterval(this.dataReadingTimer);
				this.dataReadingTimer = null;
				console.log('停止数据读取定时器');
			}
		},
		 // 清理notify状态
		clearNotifyStatus() {
			this.notifyEnabledMap.clear();
			this.retryCountMap.clear();
			console.log('清理notify状态');
		},
		// 启用通知
		async enableNotify(deviceId, serviceId, characteristicId) {
			const key = `${deviceId}_${serviceId}_${characteristicId}`;
			if (this.notifyEnabledMap.has(key)) {
				console.log('notify已启用，跳过重复启用');
				return Promise.resolve();
			}
			return new Promise((resolve, reject) => {
				uni.notifyBLECharacteristicValueChange({
					deviceId,
					serviceId,
					characteristicId,
					state: true,
					success: (res) => {
						console.log('启用通知成功:', res);
						resolve(res);
					},
					fail: (err) => {
						console.error('启用通知失败:', err);
						// 记录notify启用失败
						this.notifyEnabledMap.set(key, false);
						reject(err);
					}
				});
			});
		},
		
		// 读取特征值
		async readBLECharacteristicValue(deviceId, serviceId, characteristicId) {
			const key = `${deviceId}_${serviceId}_${characteristicId}`;
			try {
				await this.enableNotify(deviceId, serviceId, characteristicId);
				console.log('~~~~~~~~~~~开始读取数据~~~~~~~~~~~');
				return new Promise((resolve, reject) => {
					uni.readBLECharacteristicValue({
						deviceId,
						serviceId,
						characteristicId,
						success: (res) => {
							console.log('读取设备特征值成功:', res);
							this.retryCountMap.delete(key);
            				resolve(res);
						},
						fail: (err) => {
							console.error('读取设备特征值失败:', err);
							// 如果是读取失败，尝试启用通知后再读取
							if (err.errCode === 10007) {
								const retryCount = this.retryCountMap.get(key) || 0;
								if (retryCount < this.maxRetryCount) {
									console.log(`第${retryCount + 1}次重试读取特征值...`);
                					this.retryCountMap.set(key, retryCount + 1);
									console.log('尝试启用通知后重新读取');
									setTimeout(() => {
										this.readBLECharacteristicValue(deviceId, serviceId, characteristicId).then(resolve).catch(reject);
									}, 1000);
								} else {
									console.error('达到最大重试次数，停止重试');
									this.retryCountMap.delete(key);
									reject(new Error('读取特征值失败，已达到最大重试次数'));
								}
							} else {
								reject(err);
							}
						}
					});
				});
			} catch (error) {
				console.error('读取设备特征值失败:', error);
				throw error;
			}
		}
	},
	
	// 组件销毁时清理资源
	beforeDestroy() {
		console.log('组件销毁，清理蓝牙资源');
		this.stopScan();
		
		// 清理数据读取定时器
		if (this.dataReadingTimer) {
			clearInterval(this.dataReadingTimer);
			this.dataReadingTimer = null;
		}
		
		this.clearNotifyStatus();
		// 清理蓝牙数据管理器
		// bluetoothDataManager.destroy();
		
		// 重置蓝牙数据
		// this.resetBluetoothData();
		
		// 关闭蓝牙适配器
		// uni.closeBluetoothAdapter({
		// 	success: (res) => {
		// 		console.log('蓝牙适配器关闭成功:', res);
		// 	},
		// 	fail: (err) => {
		// 		console.log('蓝牙适配器关闭失败:', err);
		// 	}
		// });
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
	font-size: 28rpx;
	color: #333333;
	margin-bottom: 8rpx;
}

.device-uuid {
	font-size: 24rpx;
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
	font-size: 28rpx;
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
	font-size: 24rpx;
	transition: all 0.3s ease;
}

.stop-btn {
	background: #acc890;
	color: #ffffff;
}

.stop-btn:disabled {
	background: #cccccc;
	color: #666666;
}

.start-btn {
	background: #acc890;
	color: #ffffff;
}

.start-btn:disabled {
	background: #cccccc;
	color: #999999;
}

/* 确保弹窗覆盖tabbar */
:deep(.uni-popup) {
	z-index: 9999 !important;
}

:deep(.uni-popup__mask) {
	z-index: 9998 !important;
}

:deep(.uni-popup__wrapper) {
	z-index: 9999 !important;
}
</style> 