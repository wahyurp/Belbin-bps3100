<template>
  <div class="welcome-root">
    <div class="welcome-inner">
      <div class="welcome-animation">
        <LottieAnimation
          src="https://lottie.host/a02ab37c-d8ca-4c64-836d-28c5b463f59c/KwXW9UqcN4.json"
          :loop="true"
          :autoplay="true"
        />
      </div>

      <p class="welcome-text">
        Mari kenali dirimu! Pilih tombol kiri jika ingin mengisi kuesioner sambil mendengarkan
        musik, dan tombol kanan jika ingin mengisi tanpa musik.
      </p>

      <div class="welcome-buttons">
        <button
          type="button"
          class="welcome-btn"
          @click="$emit('start-with-music')"
        >
          <span class="welcome-btn-icon">🔊</span>
          <span class="welcome-btn-label">Dengan Musik</span>
        </button>

        <button
          type="button"
          class="welcome-btn"
          @click="$emit('start-without-music')"
        >
          <span class="welcome-btn-icon">🔇</span>
          <span class="welcome-btn-label">Tanpa Musik</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import LottieAnimation from "./LottieAnimation.vue";

defineEmits(["start-with-music", "start-without-music"]);
</script>

<style scoped>
.welcome-root {
  min-height: 100vh;
  background: #1f2647; /* nuansa biru tua seperti karedok */
  color: #f9fafb;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2.5rem 1.5rem;
}

.welcome-inner {
  max-width: 900px;
  text-align: center;
}

.welcome-animation {
  margin-bottom: 1.75rem;
}

.welcome-text {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.welcome-buttons {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.welcome-btn {
  width: 140px;
  height: 140px;
  border: none;
  border-radius: 28px;
  background: #2563eb;
  box-shadow: 0 14px 0 #1e40af;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease;
}

.welcome-btn:hover {
  filter: brightness(1.05);
}

.welcome-btn:active {
  transform: translateY(4px);
  box-shadow: 0 8px 0 #1e40af;
}

.welcome-btn-icon {
  font-size: 2.6rem;
  margin-bottom: 0.4rem;
}

.welcome-btn-label {
  font-size: 0.95rem;
}
</style>
