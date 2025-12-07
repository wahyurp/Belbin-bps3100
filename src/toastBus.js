// src/toastBus.js
import { ref } from "vue";

export const toastVisible = ref(false);
export const toastMessage = ref("");

let timeoutId = null;

export function showToast(message, duration = 2200) {
  // 1) Tutup keyboard: blur elemen yang lagi fokus
  const active = document.activeElement;
  if (active && typeof active.blur === "function") {
    active.blur();
  }

  // 2) Tampilkan toast
  toastMessage.value = message;
  toastVisible.value = true;

  // 3) Auto-hide setelah beberapa detik
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toastVisible.value = false;
  }, duration);
}



