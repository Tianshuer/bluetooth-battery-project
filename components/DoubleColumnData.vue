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
  },
  data() {
    return {
      // 存储最后一次获取到的真实数据
      lastValidData: [],
      // 标记是否曾经获取过真实数据
      hasEverReceivedData: false
    }
  },
  watch: {
    // 监听 dataItems 的变化
    dataItems: {
      handler(newData) {
        // 当有真实数据时，保存为最后一次有效数据
        if (newData && newData.length > 0) {
          this.lastValidData = [...newData]; // 深拷贝保存数据
          this.hasEverReceivedData = true;
        }
      },
      deep: true,
      immediate: true
    },
  },
  computed: {
    // 将一维数组转换为双列数据行
    dataRows() {
      const data = this.dataItems;
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
  font-size: 28rpx;;
  color: #666666;
  width: 20%;
}

.item-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 28rpx;;
  color: #333333;
  font-weight: 600;
  width: 60%;
}

.item-unit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 28rpx;;
  color: #999999;
  width: 20%;
}



</style> 