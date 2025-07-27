<template>
  <view class="common-panel">
    <!-- 验证码输入区域 - 移除发验证码按钮，只保留发送按钮 -->
    <view v-if="showVerifyCode" class="verify-section">
      <view class="verify-container">
        <text class="verify-label">{{ verifyCodePlaceholder }}</text>
        <input 
          v-model="verifyCode" 
          class="verify-input"
          maxlength="6"
          type="text"
        />
        <button 
          class="verify-btn"
          @click="handleSendCode"
        >
          {{ sendText }}
        </button>
      </view>
    </view>

    <!-- 功能按钮网格 -->
    <view v-if="functionButtons.length > 0" class="function-grid">
      <button
        v-for="(button, index) in functionButtons"
        :key="index"
        class="function-btn"
        :class="button.type || 'default'"
        @click="handleFunctionClick(button, index)"
      >
        {{ button.text }}
      </button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CommonPanel',
  props: {
    // 是否显示验证码输入区域
    showVerifyCode: {
      type: Boolean,
      default: true
    },
    // 验证码输入框占位符
    verifyCodePlaceholder: {
      type: String,
      default: '密码验证'
    },
    // 发送按钮文字
    sendText: {
      type: String,
      default: '发送'
    },
    // 功能按钮数组
    functionButtons: {
      type: Array,
      default: () => []
    },
  },
  data() {
    return {
      verifyCode: ''
    }
  },
  methods: {
    // 发送验证码
    handleSendCode() {
      this.$emit('sendCode', this.verifyCode)
    },
    
    // 功能按钮点击
    handleFunctionClick(button, index) {
      this.$emit('functionClick', { button, index })
    }
  }
}
</script>

<style scoped>
.common-panel {
  padding: 0;
  width: 100%;
}

/* 验证码区域 - 只保留一个发送按钮 */
.verify-section {
  margin-bottom: 30rpx;
}

.verify-container {
  background: linear-gradient(135deg, #7ED8A0 0%, #6BBF88 100%);
  border-radius: 25rpx;
  padding: 18rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.verify-label {
  color: #FFFFFF;
  font-size: 28rpx;
  white-space: nowrap;
  font-weight: 500;
}

.verify-input {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
  border: none;
  font-size: 28rpx;
  color: #333333;
  outline: none;
  margin: 0 15rpx;
}

.verify-input::placeholder {
  color: #999999;
}

.verify-btn {
  background-color: #FFFFFF;
  color: #6BBF88;
  border: none;
  border-radius: 18rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
  font-weight: 500;
  min-width: 120rpx;
  height: 56rpx;
  line-height: 1;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.verify-btn:active {
  transform: scale(0.95);
  background-color: #F5F5F5;
}

/* 功能按钮网格 */
.function-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.function-btn {
  width: 100%;
  color: #FFFFFF;
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #9ac580;
}
.function-btn:active {
  opacity: 0.7;
  transform: scale(0.95);
}
</style>

