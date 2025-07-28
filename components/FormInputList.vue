<template>
  <view class="form-input-list">
    <view 
      v-for="(item, index) in inputItems" 
      :key="index"
      class="input-item"
    >
      <view class="label-section">
        <text class="label">{{ item.label }}</text>
      </view>
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
import { mapGetters } from 'vuex'

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
  computed: {
    ...mapGetters([
      't'
    ])
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
.input-item {
  display: flex;
  align-items: flex-start;
  padding: 16rpx 20rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  border-radius: 25rpx;
  gap: 40rpx;
}

.input-item:last-child {
  margin-bottom: 0;
}

.label-section {
  width: 180rpx;
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 8rpx;
}

.label {
  font-size: 24rpx;
  color: #333333;
  word-break: break-all;
  line-height: 1.4;
  display: block;
}

.input-section {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15rpx;
  min-width: 0;
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
  min-width: 0;
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
  flex-shrink: 0;
}

.send-btn:active {
  transform: scale(0.95);
}
</style>
