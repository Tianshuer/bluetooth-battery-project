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
	onLoad() {
		// 获取屏幕高度
		const systemInfo = uni.getSystemInfoSync();
		this.screenHeight = systemInfo.windowHeight;
	},
	methods: {
		// 显示蓝牙设备列表
		showPopup() {
			this.$refs.bluetoothList.showPopup();
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

</style>
