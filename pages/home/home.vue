<template>
	<view class="container" :style="{ minHeight: screenHeight + 'px' }">
		<view class="main-content">
			<view class="logo-section">
				<image class="logo" src="/static/images/thunder-illustration.png" mode="aspectFit"></image>
			</view>
			<view class="brand-section">
				<image class="brand-image" src="/static/images/mlbms_product_icon.png" mode="aspectFit"></image>
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
			isScanning: false,
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
		this.screenHeight = windowInfo.windowHeight || 667;
	},
	methods: {
		// 显示蓝牙设备列表
		showPopup() {
			this.$refs.bluetoothList.showPopup();
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
	width: 800rpx;
	height: 220rpx;
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
	font-size: 32rpx;
	transition: all 0.3s ease;
	font-weight: 500;
}

.enter-btn:active {
	transform: translateY(2rpx);
	box-shadow: 0 4rpx 12rpx #acc890;
}

</style>
