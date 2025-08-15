<template>
	<!-- 蓝牙设备列表半弹窗 -->
	<uni-popup ref="popup" type="bottom" :is-mask-click="false" :safe-area="false">
		<view class="popup-content">
			<view class="popup-header">
				<view class="popup-title-wrapper">
					<text class="popup-title">{{ t('found_peripherals', localDiscoveredPeripherals.length) }}</text>
				</view>
				<text class="popup-close" @click="hidePopup">×</text>
			</view>
			<view class="popup-body">
				<!-- 设备列表 -->
				<scroll-view class="device-list" scroll-y="true">
					<view 
						class="device-item" 
						v-for="(device, index) in localDiscoveredPeripherals" 
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
					<view v-if="localDiscoveredPeripherals.length === 0 && !isScanning" class="empty-state">
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
import bleManager from '../utils/batteryManager';
export default {
	name: 'BluetoothList',
	components: {
		uniPopup
	},
	data() {
		return {
			localDiscoveredPeripherals: [],
		}
	},
	computed: {
		...mapGetters([
			't',
			'discoveredPeripherals',
			'isScanning',
			'isConnected',
		]),
	},
	watch: {
		// 监听 store 中的 discoveredPeripherals 变化
		discoveredPeripherals: {
			handler(newDevices) {
				this.localDiscoveredPeripherals = [...newDevices];
			},
			immediate: true, // 立即执行一次
			deep: true // 深度监听数组变化
		},
	},
	methods: {

		// 显示弹窗
		showPopup() {
			uni.hideTabBar({
				animation: true
			})
			
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
			
			// 停止之前的扫描
			this.stopScan(false);
			
			// 显示加载提示
			uni.showToast({
				title: this.t('loading'),
				icon: 'loading',
				duration: 5000,
				mask: true,
			});
			
			// 开始扫描
			await bleManager.startScanning();
			
			// 10秒后自动停止扫描
			setTimeout(async () => {
				await bleManager.stopScanning();
			}, 5000);
		},
	
		
		// 停止扫描
		async stopScan(isShowToast = true) {
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
			await this.connectToDevice(device);
		},
		
		// 连接到设备
		async connectToDevice(device) {
			try {
				await bleManager.connect(device);
				if (!this.isConnected) {
					uni.showToast({
						title: this.t('failed_to_connect_to_device'),
						icon: 'none',
						duration: 2000,
						mask: true,
					});
					await bleManager.disconnect();
				}
				
				// 根据当前页面位置决定是否跳转
				this.handlePageNavigation();
				
				this.hidePopup();
			} catch (error) {
				console.error('连接设备失败:', error);
				uni.showToast({
					title: this.t('failed_to_connect_to_device'),
					icon: 'none',
					duration: 2000,
					mask: true,
				});
				await bleManager.disconnect();
			}
		},
		
		// 处理页面导航逻辑
		handlePageNavigation() {
			// 获取当前页面路径
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			const currentRoute = currentPage.route;

			this.hidePopup();
			
			// 如果当前在home页面，则跳转到component页面
			if (currentRoute === 'pages/home/home') {
				setTimeout(() => {
					uni.switchTab({
						url: '/pages/tabBar/component/component',
						fail: () => {
							// 备用跳转方案
							uni.navigateTo({
								url: '/pages/tabBar/component/component'
							});
						}
					});
				}, 200);

			}
		},
		
		// 手动同步 store 数据到本地状态


	},

	// 组件销毁时清理资源
	beforeDestroy() {
		this.stopScan(false);
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


</style> 