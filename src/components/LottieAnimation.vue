<template>
  <div class="lottie-wrapper">
    <div ref="container" class="lottie-container"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import lottie from "lottie-web";

const props = defineProps({
  src: { type: String, required: true },
  loop: { type: Boolean, default: true },
  autoplay: { type: Boolean, default: true },
});

const container = ref(null);
let anim = null;

function loadAnimation() {
  if (!container.value) return;

  if (anim) {
    anim.destroy();
    anim = null;
  }

  anim = lottie.loadAnimation({
    container: container.value,
    renderer: "svg",
    loop: props.loop,
    autoplay: props.autoplay,
    path: props.src,
  });
}

onMounted(loadAnimation);

onBeforeUnmount(() => {
  if (anim) {
    anim.destroy();
    anim = null;
  }
});

watch(
  () => props.src,
  () => {
    loadAnimation();
  }
);
</script>

<style scoped>
.lottie-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.lottie-container {
  width: 260px;
  max-width: 100%;
}
@media (min-width: 768px) {
  .lottie-container {
    width: 320px;
  }
}
</style>
