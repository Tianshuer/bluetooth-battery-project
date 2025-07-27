<template>
    <view class="container" :style="{ minHeight: screenHeight + 'px' }">
        <!-- 电池状态卡片 -->
        <BatteryCard :batteryPercentage="batteryLevel" />
    </view>
</template>

<script>
    import BatteryCard from '../../../components/BatteryCard.vue'
    
    export default {
        components: {
            BatteryCard
        },
        data() {
            return {
                batteryLevel: 75,
                screenHeight: 0,
            };
        },
        onLoad() {
            this.getSystemInfo();
        },
        methods: {
            // 获取系统信息
            getSystemInfo() {
                uni.getSystemInfo({
                    success: (res) => {
                        this.screenHeight = res.windowHeight;
                    },
                    fail: (err) => {
                        console.error('获取系统信息失败:', err);
                        // 设置默认高度
                        this.screenHeight = 667;
                    }
                });
            }
        }
    };
</script>

<style scoped>
    .container {
        background-color: #f8f8f8;
        padding: 20rpx;
        box-sizing: border-box;
    }
</style> 