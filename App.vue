<script>
	import { version } from './package.json'

	export default {
		onLaunch: function() {
			console.log('蓝牙电池监控应用启动');
			console.log(`应用版本: v${version}`);
			
			// 初始化全局数据
			this.globalData = {
				bluetoothDevices: [],
				currentDevice: null,
				batteryHistory: {}
			};
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/* uni.css - 通用组件、模板样式库 */
	@import './common/uni.css';
	
	/* 专用于微信小程序 */

	/* 蓝牙电池项目全局样式 */
	page {
		background-color: #f5f5f5;
	}
	
	/* 通用按钮样式 */
	.btn-primary {
		background-color: #007aff;
		color: #ffffff;
		border-radius: 8rpx;
		padding: 20rpx 30rpx;
		font-size: 28rpx;
		border: none;
	}
	
	.btn-success {
		background-color: #52c41a;
		color: #ffffff;
		border-radius: 8rpx;
		padding: 20rpx 30rpx;
		font-size: 28rpx;
		border: none;
	}
	
	.btn-danger {
		background-color: #ff4d4f;
		color: #ffffff;
		border-radius: 8rpx;
		padding: 20rpx 30rpx;
		font-size: 28rpx;
		border: none;
	}
	
	/* 通用文本样式 */
	.text-muted {
		color: #999999;
	}
	
	.text-primary {
		color: #007aff;
	}
	
	.text-success {
		color: #52c41a;
	}
	
	.text-danger {
		color: #ff4d4f;
	}
</style>
