<template>
  <uni-popup 
    ref="popup" 
    type="bottom" 
    :is-mask-click="false"
    :safe-area="false"
  >
    <view class="advanced-popup">
      <view class="popup-header">
        <text class="popup-title">{{ $t('params_setting') }}</text>
        <view class="close-btn" @click="close">
          <text class="close-text">✕</text>
        </view>
      </view>
      <view class="advanced-content">
        <scroll-view class="params-list" scroll-y="true" show-scrollbar="false">
          <FormInputList
            :items="formItems"
            :show-text-section="false"
            :show-send-button="false"
            :show-unit-in-input="true"
            @input="onFormInput"
          />
        </scroll-view>
        <view class="popup-actions">
          <button class="action-btn clear-btn" @click="onClear">{{ $t('clear') }}</button>
          <button class="action-btn save-btn" @click="onSave">{{ $t('save') }}</button>
          <button class="action-btn write-btn" @click="onWrite">{{ $t('params_write') }}</button>
        </view>
      </view>
    </view>
  </uni-popup>
</template>

<script>
import uniPopup from '@dcloudio/uni-ui/lib/uni-popup/uni-popup.vue';
import FormInputList from './FormInputList.vue';

export default {
  name: 'AdvancedParamsPopup',
  components: {
    uniPopup,
    FormInputList
  },
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      formItems: []
    }
  },
  watch: {
    items: {
      immediate: true,
      deep: true,
      handler(newItems) {
        this.formItems = (newItems || []).map(item => ({
          label: item.label,
          placeholder: item.placeholder || '请输入',
          type: item.inputType || 'text',
          buttonText: this.$store?.getters?.t ? this.$store.getters.t('send') : '发送',
          key: item.key,
          params: item.params || '',
          command: item.command,
          unit: item.unit || '',
          value: item.params || ''
        }))
      }
    }
  },
  methods: {
    open() {
      this.$refs.popup.open();
    },
    close() {
      this.$refs.popup.close();
      this.$emit('close');
    },
    onFormInput({ item, index, value }) {
      this.$set(this.formItems[index], 'value', value)
      this.$set(this.formItems[index], 'params', value)
      this.$emit('input', { item: this.formItems[index], index, value })
    },
    onFormSend({ item, index, value }) {
      this.$emit('send', { item, index, value })
    },
    onClear() {
      this.formItems = this.formItems.map(it => ({ ...it, value: '', params: '' }))
      this.$emit('clear')
    },
    onSave() {
      const payload = this.formItems.map(it => ({ key: it.key, value: it.value }))
      this.$emit('save', payload)
    },
    onWrite() {
      const payload = this.formItems.map(it => ({ key: it.key, value: it.value }))
      this.$emit('write', payload)
    }
  }
}
</script>

<style scoped>

.advanced-popup {
  background-color: #FFFFFF;
  border-radius: 32rpx 32rpx 0 0;
  padding: 0;
  max-height: 80vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 40rpx 20rpx;
  border-bottom: 1px solid #F0F0F0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F5F5F5;
  border-radius: 50%;
}

.close-text {
  font-size: 28rpx;
  color: #666;
}

.advanced-content {
  padding: 20rpx 0;
}

.params-list {
  max-height: 60vh;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.popup-actions {
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 30rpx 40rpx;
  border-top: 1rpx solid #F0F0F0;
}

.action-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border: none;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.3s ease;
}

.clear-btn {
  background: #FF3B30;
  color: #ffffff;
}

.clear-btn:active {
  background: #CC2E25;
}

.save-btn {
  background: #34C759;
  color: #ffffff;
}

.save-btn:active {
  background: #2AA347;
}

.write-btn {
  background: #007AFF;
  color: #ffffff;
}

.write-btn:active {
  background: #0056CC;
}
</style>
