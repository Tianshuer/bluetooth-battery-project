<template>
	<view class="container" :style="{ minHeight: screenHeight + 'px' }">
		<view class="main-content">
			<view class="logo-section">
				<image class="logo" src="/static/images/thunder-illustration.png" mode="aspectFit"></image>
			</view>
			<view class="brand-section">
				<image class="brand-image" src="/static/images/product_icon.jpg" mode="aspectFit"></image>
			</view>
			<view class="text-section">
				<text class="brand-text uni-color-black">Electricity Convergence</text>
			</view>
		</view>
		<view class="bottom-section">
			<button class="enter-btn" @click="showPopup">{{ t('enter_button') }}</button>
		</view>

		<!-- 蓝牙设备列表组件 -->
		<BluetoothList ref="bluetoothList" />

	</view>
</template>

<script>
import BluetoothList from '../../components/BluetoothList.vue';
import { mapGetters } from 'vuex';
import { handleBluetoothError } from '../../utils/handleBluetoothError';
	
export default {
	components: {
		BluetoothList,
	},
	data() {
		return {
			screenHeight: 0,
			deviceList: [],
			isScanning: false
		}
	},
	computed: {
		...mapGetters([
			't'
		])
	},
	async onLoad() {
		// 获取屏幕高度
		const windowInfo = uni.getWindowInfo()
		this.screenHeight = windowInfo.windowHeight;
		// 初始化蓝牙适配器
		await this.initBluetoothAdapter();
	},
	methods: {
		// 显示蓝牙设备列表
		showPopup() {
			this.$refs.bluetoothList.showPopup();
		},
		
		// 初始化蓝牙适配器
		async initBluetoothAdapter() {
			return new Promise((resolve, reject) => {
				// 先检查蓝牙适配器状态
				uni.getBluetoothAdapterState({
					success: (res) => {
						const { available } = res.adapterState;
						console.log('蓝牙适配器状态:', res);
						if (available) {
							console.log('蓝牙适配器可用');
							resolve(res);
						} else {
							// 蓝牙适配器不可用，尝试打开
							console.log('蓝牙适配器不可用，尝试打开');
							this.openBluetoothAdapter(resolve, reject);
						}
					},
					fail: (err) => {
						console.log('获取蓝牙适配器状态失败，尝试打开:', err);
						this.openBluetoothAdapter(resolve, reject);
					}
				});
			});
		},
		// 打开蓝牙适配器
		openBluetoothAdapter(resolve, reject) {
			uni.openBluetoothAdapter({
				success: (res) => {
					console.log('蓝牙适配器初始化成功:', res);
					this.bluetoothAdapter = res;
					resolve(res);
				},
				fail: (err) => {
					console.error('蓝牙适配器初始化失败:', err);
					if (err.errMsg && err.errMsg.includes('already opened')) {
						// 蓝牙适配器已经打开，直接返回成功
						console.log('蓝牙适配器已经打开');
						resolve({ available: true });
					} else {
						handleBluetoothError(err);
						reject(err);
					}
				}
			});
		},
			
		
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
	width: 500rpx;
	height: 400rpx;
	cursor: pointer;
	transition: transform 0.2s ease;
}

.logo:active {
	transform: scale(0.95);
}


.brand-image {
	width: 400rpx;
	height: 80rpx;
}

.text-section {
	margin-bottom: 40rpx;
}

.brand-text {
	font-size: 28rpx;
	letter-spacing: 2rpx;
}

.bottom-section {
	display: flex;
	justify-content: center;
	padding: 0 80rpx;
	margin-bottom: 160px;
}

.enter-btn {
	width: 420rpx;
	height: 100rpx;
	line-height: 100rpx;
	background: #acc890;
	color: #ffffff;
	border: none;
	border-radius: 40rpx;
	font-size: 28rpx;
	transition: all 0.3s ease;
}

.enter-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 12rpx #acc890;
}

</style>
