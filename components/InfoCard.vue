<template>
  <view class="info-card">
    <view class="info-item">
      <view class="label">{{ item1Label }}</view>
      <view class="value-section">
        <text class="value">{{ item1Value }}</text>
        <text class="unit">{{ item1Unit }}</text>
      </view>
    </view>
    <view class="info-item">
      <view class="label">{{ item2Label }}</view>
      <view class="value-section">
        <text class="value">{{ item2Value }}</text>
        <text class="unit">{{ item2Unit }}</text>
      </view>
    </view>
    <view class="info-item">
      <view class="label">{{ item3Label }}</view>
      <view class="value-section">
        <text class="value">{{ item3Value }}</text>
        <text class="unit">{{ item3Unit }}</text>
      </view>
    </view>
    <view class="info-item">
      <view class="label">{{ item4Label }}</view>
      <view class="value-section">
        <text class="value">{{ item4Value }}</text>
        <text class="unit">{{ item4Unit }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "InfoCard",
  props: {
    item1Value: {
      type: [Number, String],
      default: "0.0000",
    },
    item1Label: {
      type: String,
      default: "项目1",
    },
    item1Unit: {
      type: String,
      default: "",
    },
    item2Value: {
      type: [Number, String],
      default: "0.0000",
    },
    item2Label: {
      type: String,
      default: "项目2",
      validator: function (value) {
        return value !== null && value !== undefined;
      },
    },
    item2Unit: {
      type: String,
      default: "",
    },
    item3Value: {
      type: [Number, String],
      default: "0.0000",
    },
    item3Label: {
      type: String,
      default: "项目3",
      validator: function (value) {
        return value !== null && value !== undefined;
      },
    },
    item3Unit: {
      type: String,
      default: "",
    },
    item4Value: {
      type: [Number, String],
      default: "0.0000",
    },
    item4Label: {
      type: String,
      default: "项目4",
      validator: function (value) {
        return value !== null && value !== undefined;
      },
    },
    item4Unit: {
      type: String,
      default: "",
    },
  },
  computed: {
    ...mapGetters(["t"]),
  },
  methods: {},
};
</script>

<style scoped>
.info-card {
  background: #ffffff;
  border-radius: 25rpx;
  padding: 20rpx 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0rpx;
  background-color: #fff;
  border-radius: 25rpx;
  white-space: nowrap;
  overflow: hidden;
}

.label {
  font-size: 24rpx;
  color: #333333;
  flex: 1;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.value-section {
  display: flex;
  align-items: center;
  gap: 15rpx;
  min-width: 120rpx;
  justify-content: flex-end;
  flex-shrink: 0;
}

.value {
  font-size: 24rpx;
  color: #333333;
  font-weight: normal;
  text-align: right;
  min-width: 80rpx;
  white-space: nowrap;
}

.unit {
  font-size: 24rpx;
  color: #666666;
  width: 40rpx;
  text-align: center;
  white-space: nowrap;
}
</style>
