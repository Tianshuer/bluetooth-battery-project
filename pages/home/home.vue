<template>
	<view class="container" :style="{ minHeight: screenHeight + 'px' }">
		<view class="main-content">
			<view class="logo-section">
				<image class="logo" src="/static/thunder-illustration.png" mode="aspectFit"></image>
			</view>
			<view class="brand-section">
				<image class="brand-image" src="/static/product_icon.jpg" mode="aspectFit"></image>
			</view>
			<view class="text-section">
				<text class="brand-text">Electricity Convergence</text>
			</view>
		</view>
		<view class="bottom-section">
			<button class="enter-btn" @click="showPopup">进入</button>
		</view>
		
		<!-- 半弹窗 -->
		<uni-popup ref="popup" type="bottom" :mask-click="false">
			<view class="popup-content">
				<view class="popup-header">
					<text class="popup-title">已发现 {{deviceList.length}} 个外围设备</text>
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
								<text class="device-name">{{device.name || '未知设备'}}</text>
								<text class="device-uuid">{{device.deviceId}}</text>
							</view>
						</view>
					</scroll-view>
					
					<!-- 底部按钮 -->
					<view class="popup-actions">
						<button class="action-btn stop-btn" @click="stopScan">结束扫描</button>
						<button class="action-btn start-btn" @click="startScan">开始扫描</button>
					</view>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
	import uniPopup from '@/uni_modules/uni-popup/components/uni-popup/uni-popup.vue'
	
	export default {
		components: {
			uniPopup
		},
		data() {
			return {
				screenHeight: 0,
				deviceList: [],
				isScanning: false
			}
		},
		onLoad() {
			// 获取屏幕高度
			const systemInfo = uni.getSystemInfoSync();
			this.screenHeight = systemInfo.windowHeight;
		},
		methods: {
			// 显示弹窗
			showPopup() {
				this.$refs.popup.open();
				this.startScan();
			},
			// 隐藏弹窗
			hidePopup() {
				this.stopScan();
				this.$refs.popup.close();
			},
			// 开始扫描
			startScan() {
				console.log(this.isScanning);
				
				if (this.isScanning) return;
				
				this.isScanning = true;
				this.deviceList = [];
				
				// 显示loading toast
				uni.showToast({
					title: 'loading',
					icon: 'loading',
					duration: 2000
				});
				
				// 模拟蓝牙设备扫描
				this.scanDevices();
			},
			// 结束扫描
			stopScan() {
				this.isScanning = false;
				uni.showToast({
					title: '结束扫描',
					icon: 'none',
				});
			},
			// 扫描设备（模拟数据）
			scanDevices() {
				// 模拟蓝牙设备数据
				const mockDevices = [
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
					}
				];
				
				// 模拟扫描过程
				let index = 0;
				const scanInterval = setInterval(() => {
					if (!this.isScanning || index >= mockDevices.length) {
						clearInterval(scanInterval);
						return;
					}
					
					this.deviceList.push(mockDevices[index]);
					index++;
				}, 1000);
			},
			// 选择设备
			selectDevice(device) {
				console.log(device);
				uni.showToast({
					title: `loading`,
					icon: 'loading'
				});
				
				// 跳转到component页面
				uni.switchTab({
					url: '/pages/tabBar/component/component'
				});
				
				this.hidePopup();
			}
		}
	}
</script>

<style scoped>
.container {
	display: flex;
	flex-direction: column;
	background: #f5f5f5;
	position: relative;
}

.main-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 40rpx;
}

.logo {
	width: 400rpx;
	height: 400rpx;
}


.brand-image {
	width: 300rpx;
	height: 80rpx;
}

.text-section {
	margin-bottom: 40rpx;
}

.brand-text {
	font-size: 24rpx;
	color: #333333;
	letter-spacing: 2rpx;
}

.bottom-section {
	display: flex;
	justify-content: center;
	padding: 0 80rpx;
	margin-bottom: 160px;
}

.enter-btn {
	width: 400rpx;
	height: 80rpx;
	line-height: 80rpx;
	background: #acc890;
	color: #ffffff;
	border: none;
	border-radius: 40rpx;
	font-size: 24rpx;
	transition: all 0.3s ease;
}

.enter-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 12rpx #acc890;
}

/* 弹窗样式 */
.popup-content {
	background: #ffffff;
	border-radius: 24rpx 24rpx 0 0;
	padding: 40rpx;
	min-height: 800rpx;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
}

.popup-header {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-bottom: 30rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx solid #f0f0f0;
	position: relative;
}

.popup-title {
	font-size: 24rpx;
	color: #333333;
}

.popup-close {
	font-size: 48rpx;
	color: #999999;
	line-height: 1;
	cursor: pointer;
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
}

.popup-body {
	display: flex;
	flex-direction: column;
	flex: 1;
}

/* 设备列表样式 */
.device-list {
	flex: 1;
	max-height: 600rpx;
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

</style>
