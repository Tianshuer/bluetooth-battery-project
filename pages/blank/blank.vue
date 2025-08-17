<template>
  <view class="blank-page">
    <view class="blank-content">
      <text class="blank-text">应用验证失败</text>
      <text class="blank-subtitle">请联系管理员</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'BlankPage',
  data() {
    return {}
  },
  onLoad() {
    console.log('空白页面已加载');
  }
}
</script>

<style scoped>
.blank-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.blank-content {
  text-align: center;
  padding: 40rpx;
}

.blank-text {
  font-size: 36rpx;
  color: #333;
  margin-bottom: 20rpx;
  display: block;
}

.blank-subtitle {
  font-size: 28rpx;
  color: #666;
  display: block;
}
</style> 