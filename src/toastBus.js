// src/toastBus.js
import { ref } from "vue";

export const toastVisible = ref(false);
export const toastMessage = ref("");

let timeoutId = null;

export function showToast(msg) {
  toastMessage.value = msg;
  toastVisible.value = true;

  if (timeoutId) clearTimeout(timeoutId);

  timeoutId = setTimeout(() => {
    toastVisible.value = false;
    timeoutId = null;
  }, 2200);
}
