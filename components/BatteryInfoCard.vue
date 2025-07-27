<template>
	<view class="battery-info-card">
		<view class="info-item">
			<view class="label">{{ batteryCapacityLabel }}</view>
			<view class="value-section">
				<text class="value">{{ batteryCapacity }}</text>
				<text class="unit">{{ batteryCapacityUnit }}</text>
			</view>
		</view>
		<view class="info-item">
			<view class="label">{{ remainingPowerLabel }}</view>
			<view class="value-section">
				<text class="value">{{ remainingPower }}</text>
				<text class="unit">{{ remainingPowerUnit }}</text>
			</view>
		</view>
		<view class="info-item">
			<view class="label">{{ powerLabel }}</view>
			<view class="value-section">
				<text class="value">{{ power }}</text>
				<text class="unit">{{ powerUnit }}</text>
			</view>
		</view>
		<view class="info-item">
			<view class="label">{{ cycleCapacityLabel }}</view>
			<view class="value-section">
				<text class="value">{{ cycleCapacity }}</text>
				<text class="unit">{{ cycleCapacityUnit }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: 'BatteryInfoCard',
		props: {
			batteryCapacity: {
				type: [Number, String],
				default: '0.0000'
			},
			batteryCapacityLabel: {
				type: String,
				default: '电池容量'
			},
			batteryCapacityUnit: {
				type: String,
				default: 'AH'
			},
			remainingPower: {
				type: [Number, String],
				default: '0.0000'
			},
			remainingPowerLabel: {
				type: String,
				default: '剩余电量'
			},
			remainingPowerUnit: {
				type: String,
				default: '%'
			},
			power: {
				type: [Number, String],
				default: '0.0000'
			},
			powerLabel: {
				type: String,
				default: '功率'
			},
			powerUnit: {
				type: String,
				default: 'W'
			},
			cycleCapacity: {
				type: [Number, String],
				default: '0.0000'
			},
			cycleCapacityLabel: {
				type: String,
				default: '循环容量'
			},
			cycleCapacityUnit: {
				type: String,
				default: 'AH'
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

<style scoped>
.battery-info-card {
	background: #ffffff;
	border-radius: 25rpx;
	padding: 20rpx 30rpx;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	margin-bottom: 20rpx;
}

.info-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10rpx 0rpx;
	background-color: #fff;
	border-radius: 25rpx;
}

.info-item:last-child {
	margin-bottom: 0;
}

.label {
	font-size: 20rpx;
	color: #333333;
	width: 140rpx;
	flex-shrink: 0;
	line-height: 1.2;
}

.value-section {
	display: flex;
	align-items: center;
	gap: 15rpx;
	margin-left: 30rpx;
}

.value {
	font-size: 20rpx;
	color: #333333;
	font-weight: normal;
}

.unit {
	font-size: 20rpx;
	color: #666666;
}
</style> 