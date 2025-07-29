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
							<view class="bluetooth-icon"></view>
						</view>
						<view class="device-info">
							<text class="device-name">{{device.name || t('unknown_device')}}</text>
							<text class="device-uuid">{{device.deviceId}}</text>
						</view>
					</view>
				</scroll-view>
				
				<!-- 底部按钮 -->
				<view class="popup-actions">
					<button class="action-btn stop-btn" @click="stopScan">{{ t('stop_scan') }}</button>
					<button class="action-btn start-btn" @click="startScan">{{ t('start_scan') }}</button>
				</view>
			</view>
		</view>
	</uni-popup>
</template>

<script>
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
	import { mapGetters, mapActions } from 'vuex'
	
	export default {
		name: 'BluetoothList',
		components: {
			uniPopup
		},
		data() {
			return {
				deviceList: [],
				isScanning: false
			}
		},
		computed: {
			...mapGetters([
				't'
			])
		},
		methods: {
			...mapActions([
				'setConnectionStatus'
			]),

			// 显示弹窗
			showPopup() {
				uni.hideTabBar({
					animation: true
				})
				// 每次显示弹窗时都重新开始扫描
				this.deviceList = [];
				this.isScanning = false;
				this.$refs.popup.open();
				this.startScan();

			},
			// 隐藏弹窗
			hidePopup() {
				uni.showTabBar({
					animation: true
				})
				this.$refs.popup.close();
			},
			// 开始扫描
			startScan() {
				if (this.isScanning) return;
				
				this.isScanning = true;
				this.deviceList = [];
				
				// 显示loading toast
				uni.showToast({
					title: this.t('scanning_devices'),
					icon: 'loading',
					duration: 2000
				});
				
				// 模拟蓝牙设备扫描
				this.scanDevices();
			},
			// 停止扫描
			stopScan() {
				this.isScanning = false;
				uni.showToast({
					title: this.t('stop_scan'),
					icon: 'none',
				});
			},
			// 扫描设备（模拟数据）
			scanDevices() {
				// 模拟蓝牙设备数据池
				const devicePool = [
					{
						name: 'Battery Monitor 001',
						deviceId: 'AA:BB:CC:DD:EE:FF'
					},
					{
						name: 'Smart Battery 002',
						deviceId: '11:22:33:44:55:66'
					},
					{
						name: 'Power Tracker 003',
						deviceId: 'FF:EE:DD:CC:BB:AA'
					},
					{
						name: 'Energy Monitor 004',
						deviceId: '66:55:44:33:22:11'
					},
					{
						name: 'Battery Sensor 005',
						deviceId: '99:88:77:66:55:44'
					},
					{
						name: 'Power Monitor 006',
						deviceId: '33:44:55:66:77:88'
					},
					{
						name: 'Energy Tracker 007',
						deviceId: 'CC:DD:EE:FF:AA:BB'
					},
					{
						name: 'Smart Monitor 008',
						deviceId: '22:33:44:55:66:77'
					}
				];
				
				// 随机选择3-6个设备
				const deviceCount = Math.floor(Math.random() * 4) + 3; // 3-6个设备
				const shuffledDevices = devicePool.sort(() => Math.random() - 0.5);
				const selectedDevices = shuffledDevices.slice(0, deviceCount);
				
				// 模拟扫描过程
				let index = 0;
				const scanInterval = setInterval(() => {
					if (!this.isScanning || index >= selectedDevices.length) {
						clearInterval(scanInterval);
						this.isScanning = false;
						return;
					}
					
					this.deviceList.push(selectedDevices[index]);
					index++;
				}, 800); // 稍微加快扫描速度
			},
			// 选择设备
			selectDevice(device) {
				uni.showToast({
					title: this.t('connecting'),
					icon: 'loading',
					duration: 2000
				});
				
				// 模拟连接过程
				setTimeout(() => {
					// 模拟连接结果（随机成功或失败）
					const isConnected = Math.random() > 0.3; // 70%成功率
					
					if (isConnected) {
						
						this.setConnectionStatus(true);
						
						// 延迟跳转页面
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/tabBar/component/component'
							});
						}, 1500);
						
						this.hidePopup();
					} else {
						this.setConnectionStatus(false);
						uni.showToast({
							title: this.t('connection_failed'),
							icon: 'none',
							duration: 2000
						});
						
						// 触发连接失败事件
						this.$emit('connection-failed');
					}
				}, 2000);
			}
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
	width: 40rpx;
	height: 40rpx;
	background: #007AFF;
	position: relative;
	border-radius: 4rpx;
}

.bluetooth-icon::before {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 0;
	height: 0;
	border-left: 8rpx solid transparent;
	border-right: 8rpx solid transparent;
	border-bottom: 12rpx solid #ffffff;
}

.bluetooth-icon::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 0;
	height: 0;
	border-left: 6rpx solid transparent;
	border-right: 6rpx solid transparent;
	border-top: 10rpx solid #ffffff;
	margin-top: 2rpx;
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
	color: #dddddd;
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


.start-btn {
	background: #acc890;
	color: #ffffff;
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