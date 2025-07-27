<template>
	<view class="voltage-current-card uni-bg-green">
		<view class="voltage-section">
			<text class="label">总电压</text>
			<text class="value">{{ voltage }}V</text>
		</view>
		<view class="divider">|</view>
		<view class="current-section">
			<text class="label">电流</text>
			<text class="value">{{ current }}A</text>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'VoltageCurrentCard',
		props: {
			voltage: {
				type: [Number, String],
				default: 0
			},
			current: {
				type: [Number, String],
				default: 0
			}
		},
		data() {
			return {
				
			}
		},
		methods: {
			
		}
	}
</script>

<style lang="scss">
.voltage-current-card {
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 25rpx;
	padding: 20rpx 30rpx;
	margin: 20rpx 0;
}

.voltage-section,
.current-section {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	flex: 1;
	gap: 146rpx;
}

.divider {
	font-size: 20rpx;
	color: #e0e0e0;
	margin: 0 30rpx;
}

.value {
	font-size: 20rpx;
	color: #333333;
	font-weight: 600;
}

.label {
	font-size: 20rpx;
	color: #333333;
}
</style> 