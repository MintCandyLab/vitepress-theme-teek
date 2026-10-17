<script setup lang="ts" name="TeekLayoutProvider">
import Teek from "vitepress-theme-teek";
import { nextTick, onMounted, watch } from "vue";
import { useRoute } from "vitepress";
import ContributeChart from "./ContributeChart.vue";
import NotFound from "./404.vue";
import { enhanceBilingual } from "../utils/bilingual";

const route = useRoute();

/** 内容渲染可能稍晚于挂载/路由切换，做几次延迟重试（幂等，可安全重复调用） */
function enhance() {
  [0, 60, 200, 500, 1000].forEach((delay) => {
    setTimeout(() => enhanceBilingual(), delay);
  });
}

onMounted(enhance);
watch(() => route.path, () => nextTick(enhance));
</script>

<template>
  <Teek.Layout>
    <template #teek-archives-top-before>
      <ContributeChart />
    </template>

    <template #not-found>
      <NotFound />
    </template>
  </Teek.Layout>
</template>

<style lang="scss">
.tk-my.is-circle-bg {
  margin-bottom: 20px;

  .tk-my__avatar.circle-rotate {
    margin-top: 200px;
  }
}
</style>
