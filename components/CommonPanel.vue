<template>
  <view class="common-panel">
    <!-- 验证码区域 -->
    <view class="verify-section" v-if="showVerifyCode">
      <view class="verify-container uni-bg-green uni-color-black">
        <text class="verify-label">{{ t('password_verification') }}</text>
        <input 
          v-model="verifyCode"
          :placeholder="t('input_value')"
          class="verify-input"
        />
        <button class="verify-btn uni-bg-green uni-color-black" @click="handleSendCode">
          {{ t('send') }}
        </button>
      </view>
    </view>
    
    <!-- 功能按钮网格 -->
    <view class="function-grid" v-if="functionButtons.length > 0">
      <button 
        v-for="(button, index) in functionButtons" 
        :key="index"
        class="function-btn uni-bg-green uni-color-black"
        :class="button.type || 'default'"
        @click="handleFunctionClick(button, index)"
      >
        {{ button.text }}
      </button>
    </view>
  </view>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'CommonPanel',
  props: {
    // 是否显示验证码区域
    showVerifyCode: {
      type: Boolean,
      default: true
    },
    // 功能按钮配置
    functionButtons: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      verifyCode: ''
    }
  },
  computed: {
    ...mapGetters([
      't'
    ])
  },
  methods: {
    ...mapActions([
      'setPasswordVerified'
    ]),

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
  border-radius: 25rpx;
  padding: 18rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.verify-label {
  font-size: 24rpx;
  white-space: nowrap;
}

.verify-input {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 10rpx 20rpx;
  border: none;
  font-size: 24rpx;
  color: #333333;
  outline: none;
  margin: 0 15rpx;
}

.verify-input::placeholder {
  color: #999999;
}

.verify-btn {
  border: none;
  border-radius: 18rpx;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
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
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.function-btn:active {
  opacity: 0.7;
  transform: scale(0.95);
}
</style>

