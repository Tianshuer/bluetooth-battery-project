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
				<!-- 搜索框 -->
				<view class="search-container">
					<view class="search-input-wrapper">
						<text class="iconfont icon-search search-icon"></text>
						<input 
							class="search-input" 
							:placeholder="t('search_devices')" 
							v-model="searchKeyword"
							@input="onSearchInput"
						/>
						<text 
							v-if="searchKeyword" 
							class="clear-icon" 
							@click="clearSearch"
						>×</text>
					</view>
				</view>
				
				<!-- 设备列表 -->
				<scroll-view class="device-list" scroll-y="true">
					<view 
						class="device-item" 
						v-for="(device, index) in filteredDevices" 
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
					<view v-if="filteredDevices.length === 0 && !isScanning" class="empty-state">
						<text class="empty-text">
							{{ searchKeyword ? t('no_search_results') : t('no_devices_found') }}
						</text>
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
			searchKeyword: '', // 搜索关键词
			originalDevices: [], // 保存原始设备数据
		}
	},
	computed: {
		...mapGetters([
			't',
			'discoveredPeripherals',
			'isScanning',
			'isConnected',
		]),
		// 过滤后的设备列表
		filteredDevices() {
			if (!this.searchKeyword.trim()) {
				return this.localDiscoveredPeripherals;
			}
			
			const keyword = this.searchKeyword.toLowerCase().trim();
			return this.localDiscoveredPeripherals.filter(device => {
				// 模糊查询设备名称和UUID
				const name = (device.name || '').toLowerCase();
				const deviceId = (device.deviceId || '').toLowerCase();
				
				return name.includes(keyword) || deviceId.includes(keyword);
			});
		}
	},
	watch: {
		// 监听 store 中的 discoveredPeripherals 变化
		discoveredPeripherals: {
			handler(newDevices) {
				this.localDiscoveredPeripherals = [...newDevices];
				// 同时更新原始数据
				this.originalDevices = [...newDevices];
			},
			immediate: true, // 立即执行一次
			deep: true // 深度监听数组变化
		},
	},
	methods: {
		...mapActions([
			'setBluetoothDevice',
		]),
		// 搜索输入处理
		onSearchInput() {
			// 实时搜索，不需要额外处理，computed 会自动更新
		},
		
		// 清除搜索
		clearSearch() {
			this.searchKeyword = '';
		},
		
		// 显示弹窗
		showPopup() {
			uni.hideTabBar({
				animation: true
			})
			
			// 清空搜索关键词
			this.searchKeyword = '';
			
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
			
			// 清空搜索关键词
			this.searchKeyword = '';

			// 确保隐藏 loading
			uni.hideLoading();

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
			
			// 停旧扫描
			this.stopScan(false);

			// 显示可控的 loading
			uni.showLoading({ title: this.t('loading'), mask: true });
			
			try {
				// 启动扫描
				await bleManager.startScanning();

				// 活跃检测：列表长度在一段时间内不再变化则隐藏 loading
				let lastLen = (bleManager.discoveredPeripherals || []).length;
				let lastChangeTs = Date.now();
				const idleWindowMs = 1200;   // 1.2s 无变化视为稳定

				const watchInterval = setInterval(() => {
					const list = bleManager.discoveredPeripherals || [];
					const len = list.length;
					if (len !== lastLen) {
						lastLen = len;
						lastChangeTs = Date.now();
					}
					const idleFor = Date.now() - lastChangeTs;

					// 列表已出现且稳定 → 隐藏 loading
					if (lastLen > 0 && idleFor >= idleWindowMs) {
						uni.hideLoading();
						clearInterval(watchInterval);
					}
				}, 300);

				// 最长 10 秒自动停止扫描（并隐藏 loading）
				const hardStop = setTimeout(async () => {
					await bleManager.stopScanning();
					uni.hideLoading();
					clearInterval(watchInterval);
				}, 10000);

				// 保障：页面离开/再次触发时清理
				this.$once('hook:beforeDestroy', () => {
					clearInterval(watchInterval);
					clearTimeout(hardStop);
					uni.hideLoading();
				});
			} catch (error) {
				// 扫描出错时隐藏 loading
				console.error('扫描失败:', error);
				uni.hideLoading();
			}
		},
	
		
		// 停止扫描
		async stopScan(isShowToast = true) {
			try {
				await bleManager.stopScanning();
				
				// 停止扫描时隐藏 loading
				uni.hideLoading();
				
				if (isShowToast) {
					uni.showToast({
						title: this.t('stop_scan'),
						icon: 'none',
					});
				}
			} catch (error) {
				// 停止扫描出错时也隐藏 loading
				console.error('停止扫描失败:', error);
				uni.hideLoading();
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
				
				this.setBluetoothDevice({
					deviceId: device.deviceId,
					name: device.name
				});
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
		// 确保组件销毁时隐藏 loading
		uni.hideLoading();
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

/* 搜索框样式 */
.search-container {
	margin-bottom: 20rpx;
	padding: 0 10rpx;
}

.search-input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background: #f5f5f5;
	border-radius: 20rpx;
	padding: 0 20rpx;
	height: 72rpx;
}

.search-icon {
	color: #999999;
	font-size: 32rpx;
	margin-right: 16rpx;
}

.search-input {
	flex: 1;
	height: 100%;
	font-size: 28rpx;
	color: #333333;
	background: transparent;
	border: none;
	outline: none;
	box-sizing: border-box;
}

.search-input::placeholder {
	color: #999999;
}

.clear-icon {
	color: #999999;
	font-size: 36rpx;
	padding: 8rpx;
	cursor: pointer;
	transition: color 0.2s;
}

.clear-icon:active {
	color: #666666;
}

/* 设备列表样式 */
.device-list {
	flex: 1;
	margin-bottom: 30rpx;
	max-height: 60vh;
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