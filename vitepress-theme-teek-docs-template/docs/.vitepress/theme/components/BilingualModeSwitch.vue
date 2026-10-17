<script setup lang="ts" name="BilingualModeSwitch">
import { onMounted, ref } from "vue";
import {
  BI_DEFAULT_MODE,
  BI_MODE_OPTIONS,
  applyBiMode,
  readBiMode,
  type BiMode,
} from "../utils/bilingual";

const mode = ref<BiMode>(BI_DEFAULT_MODE);

function select(next: BiMode) {
  mode.value = next;
  applyBiMode(next);
}

// 每次进入文章时恢复用户上次选择的显示模式（默认「仅英文」）
onMounted(() => select(readBiMode()));
</script>

<template>
  <div class="tk-bi-switch">
    <span class="tk-bi-switch__label">整句显示</span>
    <button
      v-for="option in BI_MODE_OPTIONS"
      :key="option.value"
      type="button"
      class="tk-bi-switch__btn"
      :class="{ 'is-on': mode === option.value }"
      :aria-pressed="mode === option.value"
      :title="option.hint"
      @click="select(option.value)"
    >
      {{ option.label }}
    </button>
    <span class="tk-bi-switch__tip">译文默认隐藏，可随时切换中英对照</span>
  </div>
</template>

<style scoped>
.tk-bi-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 16px 0 24px;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
}

.tk-bi-switch__label {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.tk-bi-switch__btn {
  padding: 5px 14px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 16px;
  background-color: transparent;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.6;
  cursor: pointer;
  transition: background-color 0.25s, color 0.25s;
}

.tk-bi-switch__btn:hover,
.tk-bi-switch__btn.is-on {
  background-color: var(--vp-c-brand-1);
  color: var(--vp-c-white);
}

.tk-bi-switch__tip {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

@media (max-width: 639px) {
  .tk-bi-switch__tip {
    display: none;
  }
}
</style>
