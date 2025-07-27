<template>
  <view class="double-column-data">
    <view class="data-header" v-if="title">
      <text class="header-title">{{ title }}</text>
    </view>
    
    <!-- 有数据时显示数据内容 -->
    <view v-if="hasData" class="data-content">
      <view 
        v-for="(row, index) in dataRows" 
        :key="index"
        class="data-row"
      >
        <!-- 左列数据 -->
        <view class="data-item left" v-if="row.left">
          <text class="item-label">{{ row.left.label }}</text>
          <text class="item-value">{{ formatValue(row.left.value) }}</text>
          <text class="item-unit">{{ row.left.unit }}</text>
        </view>
        <view class="data-item empty" v-else></view>
        
        <!-- 右列数据 -->
        <view class="data-item right" v-if="row.right">
          <text class="item-label">{{ row.right.label }}</text>
          <text class="item-value">{{ formatValue(row.right.value) }}</text>
          <text class="item-unit">{{ row.right.unit }}</text>
        </view>
        <view class="data-item empty" v-else></view>
      </view>
    </view>
    
    <!-- 空态显示 -->
    <view v-else class="empty-state">
      <view class="empty-icon">
        <text class="icon-text">📊</text>
      </view>
      <view class="empty-text">
        <text class="empty-title">{{ emptyConfig.title }}</text>
        <text class="empty-description">{{ emptyConfig.description }}</text>
      </view>
      <button 
        v-if="emptyConfig.showButton" 
        class="empty-button"
        @click="handleEmptyAction"
      >
        {{ emptyConfig.buttonText }}
      </button>
    </view>
  </view>
</template>

<script>
export default {
  name: 'DoubleColumnData',
  props: {
    // 标题
    title: {
      type: String,
      default: ''
    },
    // 数据项数组
    dataItems: {
      type: Array,
      default: () => []
    },
    // 数值格式化配置
    valueFormat: {
      type: Object,
      default: () => ({
        decimals: 4,  // 小数位数
        padding: true // 是否补零
      })
    },
    // 空态配置
    emptyConfig: {
      type: Object,
      default: () => ({
        title: '暂无数据',
        description: '设备未连接或数据加载中',
        showButton: true,
        buttonText: '刷新数据',
        icon: '📊'
      })
    }
  },
  computed: {
    // 是否有数据
    hasData() {
      return this.dataItems && this.dataItems.length > 0
    },
    
    // 将一维数组转换为双列数据行
    dataRows() {
      const rows = []
      for (let i = 0; i < this.dataItems.length; i += 2) {
        const row = {
          left: this.dataItems[i] || null,
          right: this.dataItems[i + 1] || null
        }
        rows.push(row)
      }
      return rows
    }
  },
  methods: {
    // 格式化数值显示
    formatValue(value) {
      if (value === null || value === undefined) {
        return '0.0000'
      }
      
      const num = parseFloat(value)
      if (isNaN(num)) {
        return '0.0000'
      }
      
      if (this.valueFormat.padding) {
        return num.toFixed(this.valueFormat.decimals)
      } else {
        return num.toString()
      }
    },
    
    // 空态按钮点击事件
    handleEmptyAction() {
      this.$emit('emptyAction')
    }
  }
}
</script>

<style scoped>
.double-column-data {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.data-header {
  padding-bottom: 20rpx;
  border-bottom: 1px solid #F0F0F0;
  margin-bottom: 30rpx;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.data-content {
  
}

.data-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  margin-bottom: 24rpx;
}

.data-row:last-child {
  margin-bottom: 0;
}

.data-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 26rpx 28rpx;
  background-color: #F8F9FA;
  border-radius: 12rpx;
  line-height: 1;
}

.data-item.empty {
  background-color: transparent;
  border: 1px dashed #E0E0E0;
}

.item-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #666666;
  width: 20%;
}

.item-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 24rpx;
  color: #333333;
  font-weight: 600;
  width: 60%;
}

.item-unit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 24rpx;
  color: #999999;
  width: 20%;
}

/* 空态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  text-align: center;
}

.empty-icon {
  margin-bottom: 30rpx;
}

.icon-text {
  font-size: 100rpx;
  line-height: 1;
  opacity: 0.3;
}

.empty-text {
  margin-bottom: 40rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 16rpx;
  line-height: 1.4;
}

.empty-description {
  display: block;
  font-size: 26rpx;
  color: #999999;
  line-height: 1.5;
}

.empty-button {
  background: linear-gradient(135deg, #7ED8A0 0%, #6BBF88 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 25rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  min-width: 200rpx;
  box-shadow: 0 4rpx 15rpx rgba(126, 216, 160, 0.3);
  transition: all 0.3s ease;
}

.empty-button:active {
  transform: translateY(2rpx);
  box-shadow: 0 2rpx 10rpx rgba(126, 216, 160, 0.3);
}
</style> 