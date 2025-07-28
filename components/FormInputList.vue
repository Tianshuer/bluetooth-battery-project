<template>
  <view class="form-input-list">
    <view 
      v-for="(item, index) in inputItems" 
      :key="index"
      class="input-item"
    >
      <view class="label">{{ item.label }}</view>
      <view class="input-section">
        <input 
          v-model="item.value"
          :placeholder="item.placeholder || '请输入'"
          :type="item.type || 'text'"
          class="input-field"
          @input="handleInput(item, index)"
        />
        <button 
          class="send-btn uni-bg-green uni-color-black"
          @click="handleSend(item, index)"
        >
          {{ item.buttonText || '发送' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'FormInputList',
  props: {
    // 输入项配置数组
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      inputItems: []
    }
  },
  watch: {
    items: {
      handler(newItems) {
        // 深度复制数据，确保每个项都有value属性
        this.inputItems = newItems.map(item => ({
          ...item,
          value: item.value || ''
        }))
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    // 输入事件处理
    handleInput(item, index) {
      this.$emit('input', {
        item,
        index,
        value: item.value
      })
    },
    
    // 发送按钮点击事件
    handleSend(item, index) {
      this.$emit('send', {
        item,
        index,
        value: item.value
      })
    }
  }
}
</script>

<style scoped>
.form-input-list {
}

.input-item {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 25rpx;
}

.input-item:last-child {
  margin-bottom: 0;
}

.label {
  font-size: 24rpx;
  color: #333333;
  width: 140rpx;
  flex-shrink: 0;
  line-height: 1.2;
}

.input-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-left: 30rpx;
}

.input-field {
  flex: 1;
  background-color: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: #333333;
  outline: none;
  transition: border-color 0.2s ease;
  height: 60rpx;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #7ED8A0;
}

.input-field::placeholder {
  color: #CCCCCC;
  font-size: 26rpx;
}

.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  padding: 0;
  font-size: 20rpx;
  width: 80rpx;
  height: 60rpx;
  transition: all 0.2s ease;
}

.send-btn:active {
  transform: scale(0.95);
}
</style>
