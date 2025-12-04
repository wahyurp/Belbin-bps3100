<template>
  <div class="segment-card">
    <h2>{{ title }}</h2>
    <p class="segment-description">
      {{ description }}
    </p>
    <p
      class="segment-remaining"
      :class="{ 'segment-remaining--error': remainingPoints !== 0 }"
    >
      Sisa poin: {{ remainingPoints }}
    </p>

    <div class="items-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="item-row"
      >
        <div class="item-text">
          <strong>({{ item.id }})</strong> {{ item.text }}
        </div>
        <input
          type="number"
          min="0"
          class="item-input"
          :disabled="isFieldDisabled(item.id)"
          :value="localAnswers[item.id] ?? ''"
          @input="updateValue(item.id, $event)"
        />
      </div>
    </div>

    <div class="segment-actions">
      <button
        v-if="showBack"
        type="button"
        @click="$emit('back')"
        class="btn-secondary"
      >
        Sebelumnya
      </button>

      <button
        type="button"
        :disabled="remainingPoints !== 0"
        @click="handleNext"
        class="btn-primary"
      >
        {{ isLast ? 'Lihat Hasil' : 'Lanjut' }}
      </button>
    </div>

    <p v-if="remainingPoints !== 0" class="hint">
      Jumlah poin harus tepat {{ totalPoints }} sebelum lanjut.
    </p>

    <!-- TOAST ERROR -->
    <div v-if="toastVisible" class="toast-error">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch, ref } from "vue";

const props = defineProps({
  title: String,
  description: String,
  totalPoints: Number,
  items: Array,
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  showBack: {
    type: Boolean,
    default: false,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "next", "back"]);

// --- state lokal jawaban ---
const localAnswers = reactive({ ...props.modelValue });

// sinkron kalau parent reset / load ulang
watch(
  () => props.modelValue,
  (newVal) => {
    Object.keys(localAnswers).forEach((k) => delete localAnswers[k]);
    Object.entries(newVal || {}).forEach(([k, v]) => {
      localAnswers[k] = v;
    });
  },
  { deep: true }
);

// --- TOAST ERROR ---
const toastVisible = ref(false);
const toastMessage = ref("");
let toastTimeoutId = null;

function showToast(msg) {
  toastMessage.value = msg;
  toastVisible.value = true;

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }
  toastTimeoutId = setTimeout(() => {
    toastVisible.value = false;
    toastTimeoutId = null;
  }, 2500);
}

// --- SISA POIN ---
// --- SISA POIN & TOTAL ---
const remainingPoints = computed(() => {
  const sum = Object.values(localAnswers).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  return props.totalPoints - sum;
});

// total saat ini (buat logic disable)
const currentTotal = computed(
  () => props.totalPoints - remainingPoints.value
);

// field mana yang harus disabled?
function isFieldDisabled(itemId) {
  const val = Number(localAnswers[itemId] || 0);

  // kalau sudah ada nilai (>0) -> tetap bisa diedit
  if (val > 0) return false;

  // kalau masih 0/kosong & total sudah penuh -> disable
  return currentTotal.value >= props.totalPoints;
}

// --- UPDATE INPUT ---
function updateValue(itemId, event) {
  const raw = String(event.target.value).trim();
  const num = Number(raw);

  const prevRaw = localAnswers[itemId] ?? "";
  const prevNum = Number(prevRaw || 0);

  // ==== KOSONG / TIDAK VALID / NEGATIF → JADI '' ====
  if (raw === "" || isNaN(num) || num <= 0) {
    localAnswers[itemId] = "";
    emit("update:modelValue", { ...localAnswers });
    return;
  }

  const safeNum = num;

  // total sekarang (sebelum perubahan)
  const totalBefore = Object.values(localAnswers).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );

  // === RULE 1: total sudah penuh, kolom lain yg semula 0 tidak boleh diisi ===
  if (totalBefore >= props.totalPoints) {
    if (prevNum === 0 && safeNum > 0) {
      showToast(
        "Poin sudah penuh. Kurangi poin di pernyataan lain terlebih dahulu."
      );
      // PAKSA UI BALIK KE SEBELUMNYA
      event.target.value = "";
      return;
    }
    // kalau prevNum > 0 masih boleh diubah (misal dikurangi)
  }

  // hitung total baru kalau nilai item ini diganti
  let otherSum = 0;
  for (const [key, val] of Object.entries(localAnswers)) {
    if (key !== itemId) {
      otherSum += Number(val) || 0;
    }
  }
  const newTotal = otherSum + safeNum;

  // === RULE 2: Jangan biarkan total > totalPoints (11) ===
  if (newTotal > props.totalPoints) {
    const remaining = props.totalPoints - otherSum;

    if (remaining <= 0) {
      showToast("Sisa poin sudah 0. Kurangi poin di pernyataan lain dulu.");
    } else {
      showToast(`Sisa poin hanya ${remaining}.`);
    }

    // PAKSA UI BALIK KE NILAI SEBELUMNYA
    event.target.value = prevRaw === "" ? "" : String(prevRaw);
    return;
  }

  // aman → simpan
  localAnswers[itemId] = safeNum;
  emit("update:modelValue", { ...localAnswers });
}




// --- NEXT ---
function handleNext() {
  if (remainingPoints.value === 0) {
    emit("next");
  }
}
</script>

<style scoped>
.segment-card {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.75rem;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  background: white;
}

.segment-description {
  margin-bottom: 0.75rem;
  color: #4b5563;
}

.segment-remaining {
  font-weight: 600;
  margin-bottom: 1rem;
}
.segment-remaining--error {
  color: #b91c1c;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
.item-text {
  flex: 1;
}
.item-input {
  width: 80px;
  padding: 0.35rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  text-align: center;
}

.segment-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}
.btn-primary {
  background: #2563eb;
  color: white;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.hint {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #dc2626;
}

/* TOAST ERROR */
.toast-error {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translateX(-50%);
  background: #dc2626;
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
  font-size: 0.9rem;
  z-index: 9999;
  animation: fade-in-out 0.3s ease-out;
}

@keyframes fade-in-out {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
