<template>
	<view class="voltage-current-card uni-bg-green">
		<view class="voltage-section">
			<text class="label">{{ t('total_voltage') }}</text>
			<text class="value">{{ voltage }}V</text>
		</view>
		<view class="divider"></view>
		<view class="current-section">
			<text class="label">{{ t('current') }}</text>
			<text class="value">{{ current }}A</text>
		</view>
	</view>
</template>

<script>
import { mapGetters } from 'vuex'

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
	computed: {
		...mapGetters([
			't'
		])
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
	white-space: nowrap;
	overflow: hidden;
}

.voltage-section,
.current-section {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	flex: 1;
	white-space: nowrap;
	padding: 0 20rpx;
}

.divider {
	width: 1rpx;
	height: 40rpx;
	background-color: #ffffff;
	margin: 0 30rpx;
	flex-shrink: 0;
}

.value {
	font-size: 28rpx;
	color: #333333;
	font-weight: 600;
	white-space: nowrap;
	flex-shrink: 0;
}

.label {
	font-size: 28rpx;
	color: #333333;
}
</style> 