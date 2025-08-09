<template>
  <view class="double-column-data">
    <view class="data-header" v-if="title">
      <text class="header-title">{{ title }}</text>
    </view>
    
    <!-- 显示数据内容（有数据或无数据时都显示，无数据时显示0.0000） -->
    <view class="data-content">
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
      }),
    },
    // 默认数据项配置（当没有数据时显示的默认项）
    defaultDataItems: {
      type: Array,
      default: () => {
        let fakeData = []
        for (let i = 0; i < 20; i++) {
          fakeData.push({
            label: i + 1,
            value: '0.0000',
            unit: 'V',
          })
        }
        return fakeData;
      },
    }
  },
  computed: {
    // 是否有数据
    hasData() {
      return this.dataItems && this.dataItems.length > 0
    },
    
    // 将一维数组转换为双列数据行
    dataRows() {
      const data = this.hasData ? this.dataItems : this.defaultDataItems;
        const rows = []
        for (let i = 0; i < data.length; i += 2) {
          const row = {
            left: data[i] || null,
            right: data[i + 1] || null
          }
          rows.push(row)
        }
        return rows;
    },
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
  }
}
</script>

<style scoped>
.double-column-data {
  background-color: #f5f5f5;
  padding: 30rpx;
  margin-bottom: 20rpx;
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
</style> 