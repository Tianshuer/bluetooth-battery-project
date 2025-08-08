<script>
	import { version } from './package.json'
	import { getTabBarConfig } from './utils/tabBarConfig.js'
	import bleManager from './utils/batteryManager'

	export default {
		onLaunch: function() {
			console.log('App Launch')
			// 初始化语言设置
			this.$store.dispatch('initLanguage')
			// 初始化状态栏高度
			this.$store.dispatch('initStatusBarHeight')
			// 设置初始 tabbar
			this.updateTabBar()
			bleManager._notifyListeners();
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			// 更新 tabbar 文本
			updateTabBar() {
				try {
					const t = this.$store.getters.t
					const tabBarConfig = getTabBarConfig(t)
					
					// 设置 tabbar 文本
					tabBarConfig.list.forEach((item, index) => {
						uni.setTabBarItem({
							index: index,
							text: item.text
						})
					})
				} catch (error) {
					console.error('更新 tabbar 失败:', error)
				}
			}
		},
		watch: {
			// 监听语言变化
			'$store.state.languageChangeTrigger': function() {
				this.updateTabBar()
			}
		}
	}
</script>

<style lang="scss">
	/* uni.css - 通用组件、模板样式库 */
	@import './common/uni.css';
	@import './static/css/iconfont.css';

	/* 专用于微信小程序 */

	/* 蓝牙电池项目全局样式 */
	page {
		background-color: #f5f5f5;
	}
	
	/* 状态栏高度变量 */
	:root {
		--status-bar-height: 0px;
	}
	
	/* 状态栏边距类 */
	.status-bar-margin {
		margin-top: var(--status-bar-height);
	}
	
	/* 状态栏高度类 */
	.status-bar-height {
		height: var(--status-bar-height);
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
