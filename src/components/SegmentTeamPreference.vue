<template>
  <div class="segment-card">
    <h2>Preferensi Tim</h2>
    <p class="segment-description">
      Saya merasa, saya dapat berkontribusi dengan optimal pada tim berikut
      (Pilih minimal 1, maksimal 3).
    </p>

    <!-- PILIHAN TIM -->
    <div class="pref-list">
      <div
        class="pref-row"
        v-for="(value, idx) in localTeams"
        :key="idx"
      >
        <label class="pref-label">
          Pilihan {{ idx + 1 }}
        </label>

        <!-- AUTOCOMPLETE ala Materialize -->
        <div class="pref-autocomplete">
          <input
            type="text"
            class="pref-input"
            v-model="searchTexts[idx]"
            :placeholder="localTeams[idx] || 'Ketik nama tim...'"
            @focus="openDropdown(idx)"
            @input="onSearchInput(idx)"
            @blur="handleBlur(idx)"
          />

          <!-- DROPDOWN SUGGESTION -->
          <ul
            v-if="activeIndex === idx && hasAnyOption(idx)"
            class="pref-dropdown"
          >
            <!-- BPS PROVINSI -->
            <li
              v-if="optionsProvForIndex(idx).length"
              class="pref-group"
            >
              BPS Provinsi
            </li>
            <li
              v-for="team in optionsProvForIndex(idx)"
              :key="'prov-' + team"
              class="pref-item"
              @mousedown.prevent="selectOption(idx, team)"
            >
              {{ team }}
            </li>

            <!-- BPS KAB/KOTA -->
            <li
              v-if="optionsKabkoForIndex(idx).length"
              class="pref-group"
            >
              BPS Kabupaten/Kota
            </li>
            <li
              v-for="team in optionsKabkoForIndex(idx)"
              :key="'kab-' + team"
              class="pref-item"
              @mousedown.prevent="selectOption(idx, team)"
            >
              {{ team }}
            </li>
          </ul>
        </div>

        <button
          v-if="localTeams.length > 1"
          type="button"
          class="btn-remove"
          @click="removeRow(idx)"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- TOMBOL TAMBAH DI TENGAH -->
    <div class="pref-actions">
      <button
        v-if="localTeams.length < 3"
        type="button"
        class="btn-add"
        :disabled="!canAddRow"
        @click="addRow"
      >
        + Tambah pilihan
      </button>
    </div>

    <!-- TEXTAREA SARAN -->
    <div class="suggestion-block">
      <label class="suggestion-label">
        Saran untuk <span class="hashtag">#2026LebihBaik</span>
      </label>
      <textarea
        class="suggestion-textarea"
        rows="3"
        v-model="suggestion"
        placeholder="Tulis saran, harapan, atau ide perbaikan ..."
      ></textarea>
    </div>

    <div class="segment-actions">
      <button
        v-if="showBack"
        type="button"
        class="btn-secondary"
        :disabled="loading"
        @click="$emit('back')"
      >
        Sebelumnya
      </button>


      <button
        type="button"
        class="btn-primary"
        :disabled="!isFormValid || loading"
        @click="handleNext"
      >
        <template v-if="loading">
          <span class="spinner"></span>
          <span>Sedang mengirim...</span>
        </template>
        <template v-else>
          {{ isLast ? 'Lihat Hasil' : 'Lanjut' }}
        </template>
      </button>

    </div>

    <!-- HINT -->
    <p v-if="!hasValidTeam" class="hint">
      Pilih minimal 1 tim dari daftar sebelum melanjutkan.
    </p>
    <p v-else-if="!isSuggestionEnough" class="hint">
      Saran minimal 50 karakter.
    </p>

    <!-- ============ MODAL KONFIRMASI ============ -->
    <div
      v-if="showConfirm"
      class="modal-backdrop"
    >
      <div class="modal-card">
        <h3>Konfirmasi Preferensi Tim</h3>
        <p class="modal-text">
          Berikut pilihan tim yang kamu isi. Pastikan sudah sesuai sebelum melihat hasil Belbin:
        </p>

        <ul class="modal-list">
          <li
            v-for="(team, i) in validTeams"
            :key="i"
          >
            <strong>Pilihan {{ i + 1 }}:</strong> {{ team }}
          </li>
        </ul>

        <p v-if="validTeams.length === 0" class="modal-text">
          Tidak ada tim yang valid. Silakan periksa kembali.
        </p>

        <div class="modal-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="closeConfirm"
          >
            Kembali Ubah
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="validTeams.length === 0 || loading"
            @click="confirmAndEmit"
          >
            <template v-if="loading">
              <span class="spinner"></span>
              <span>Mengirim &amp; menyimpan...</span>
            </template>
            <template v-else>
              Konfirmasi &amp; Lanjut
            </template>
          </button>

        </div>
      </div>
    </div>
    <!-- ============ END MODAL ============ -->
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

/* ===== OPSI TIM ===== */
const TEAM_OPTIONS_PROV = [
  "Tim Bagian Umum SDM dan Hukum",
  "Tim Bagian Umum Pengadaan Barang dan Jasa",
  "Tim Bagian Umum Humas dan Kelembagaan",
  "Tim Bagian Umum Keuangan dan Perencanaan",
  "Tim Bagian Umum Rumah Tangga",
  "Tim Sensus",
  "Tim Statistik Sosial",
  "Tim Statistik Distribusi dan Jasa",
  "Tim Keuangan, Teknologi Informasi dan Pariwisata",
  "Tim Statistik Produksi",
  "Tim Sumber Daya Mineral dan Kontruksi",
  "Tim Neraca Wilayah",
  "Tim Analisis Statistik dan Neraca Satelit",
  "Tim Sistem dan Informasi Statistik",
  "Tim Pembinaan dan Pelaksanaan Statistik Sektoral",
  "Tim Diseminasi dan Pelayanan Statistik",
  "Tim Reformasi Birokrasi dan Manajemen Perubahan",
  "Tim Manajemen Lapangan dan Mitra",
  "Tim Manajemen Resiko",
  "Tim Penjamin Kualitas",
  "Tim Metodologi Sensus dan Survei",
];

const TEAM_OPTIONS_KABKO = [
  "Bagian Umum BPS Kabupaten/Kota",
  "Tim Statistik Sosial BPS Kabupaten/Kota",
  "Tim Statistik Distribusi BPS Kabupaten/Kota",
  "Tim Statistik Produksi BPS Kabupaten/Kota",
  "Tim Nerwilis BPS Kabupaten/Kota",
  "Tim IPDS BPS Kabupaten/Kota",
];

const TEAM_OPTIONS = [...TEAM_OPTIONS_PROV, ...TEAM_OPTIONS_KABKO];

function isValidTeam(val) {
  return TEAM_OPTIONS.includes(val);
}

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ teams: [], suggestion: "" }),
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
  // ⬇️ TAMBAH INI
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "back", "next"]);


/* ===== STATE LOKAL ===== */
const localTeams = ref([]);
const suggestion = ref("");
const searchTexts = ref([]);
const activeIndex = ref(null);

/* modal */
const showConfirm = ref(false);

/* ----- SYNC DARI PARENT ----- */
function syncFromModel() {
  const mv = props.modelValue || {};
  let teamsFromModel = [];

  if (Array.isArray(mv)) {
    teamsFromModel = mv;
  } else if (Array.isArray(mv.teams)) {
    teamsFromModel = mv.teams;
  }

  localTeams.value = teamsFromModel.slice(0, 3);
  if (localTeams.value.length === 0) {
    localTeams.value = [""];
  }

  searchTexts.value = localTeams.value.map((v) => v || "");
  suggestion.value =
    typeof mv.suggestion === "string" ? mv.suggestion : "";
}

syncFromModel();

watch(
  () => props.modelValue,
  () => {
    syncFromModel();
  },
  { deep: true }
);

function emitUpdate() {
  emit("update:modelValue", {
    teams: [...localTeams.value],
    suggestion: suggestion.value,
  });
}

watch(suggestion, () => {
  emitUpdate();
});

/* ===== VALIDATION ===== */
const hasValidTeam = computed(() =>
  localTeams.value.some((val) => isValidTeam(val))
);

const isSuggestionEnough = computed(
  () => (suggestion.value || "").trim().length >= 50
);

const isFormValid = computed(
  () => hasValidTeam.value && isSuggestionEnough.value
);

const hasEmptyOrInvalidRow = computed(() =>
  localTeams.value.some((val) => !isValidTeam(val))
);

const canAddRow = computed(
  () => localTeams.value.length < 3 && !hasEmptyOrInvalidRow.value
);

const validTeams = computed(() =>
  localTeams.value.filter((t) => isValidTeam(t))
);

/* ===== AUTOCOMPLETE ===== */
function ensureSearchLength() {
  if (searchTexts.value.length !== localTeams.value.length) {
    searchTexts.value = localTeams.value.map((v, i) => {
      return searchTexts.value[i] !== undefined
        ? searchTexts.value[i]
        : (v || "");
    });
  }
}

function selectedExceptIndex(idx) {
  return localTeams.value
    .map((v, i) => (i === idx ? null : v || null))
    .filter((v) => v !== null);
}

function filteredList(baseList, idx) {
  ensureSearchLength();

  const used = new Set(selectedExceptIndex(idx));
  const current = localTeams.value[idx] || "";
  const q = (searchTexts.value[idx] || "").toLowerCase().trim();

  return baseList.filter((team) => {
    if (team === current) {
      if (!q) return true;
      return team.toLowerCase().includes(q);
    }
    if (used.has(team)) return false;
    if (!q) return true;
    return team.toLowerCase().includes(q);
  });
}

function optionsProvForIndex(idx) {
  return filteredList(TEAM_OPTIONS_PROV, idx);
}

function optionsKabkoForIndex(idx) {
  return filteredList(TEAM_OPTIONS_KABKO, idx);
}

function hasAnyOption(idx) {
  return (
    optionsProvForIndex(idx).length > 0 ||
    optionsKabkoForIndex(idx).length > 0
  );
}

function openDropdown(idx) {
  activeIndex.value = idx;
}

function closeDropdownLater(idx) {
  setTimeout(() => {
    if (activeIndex.value === idx) {
      activeIndex.value = null;
    }
  }, 150);
}

function onSearchInput(idx) {
  const text = (searchTexts.value[idx] || "").trim();
  if (!text) {
    localTeams.value[idx] = "";
    emitUpdate();
  }
  activeIndex.value = idx;
}

function handleBlur(idx) {
  const currentTeam = localTeams.value[idx] || "";
  const currentSearch = searchTexts.value[idx] || "";

  // kalau user cuma ngetik tapi tidak pilih dari dropdown,
  // balikin lagi ke nilai tim yang terakhir valid (atau kosong)
  if (currentSearch !== currentTeam) {
    searchTexts.value[idx] = currentTeam;
  }
  closeDropdownLater(idx);
}

function selectOption(idx, value) {
  localTeams.value[idx] = value;
  searchTexts.value[idx] = value;
  activeIndex.value = null;
  emitUpdate();
}

/* ===== ROW ACTIONS ===== */
function addRow() {
  if (!canAddRow.value) return;
  localTeams.value.push("");
  searchTexts.value.push("");
  emitUpdate();
}

function removeRow(idx) {
  localTeams.value.splice(idx, 1);
  searchTexts.value.splice(idx, 1);

  if (localTeams.value.length === 0) {
    localTeams.value.push("");
    searchTexts.value.push("");
  }
  emitUpdate();
}

/* ===== MODAL & NEXT ===== */

// buang tim yang tidak valid sebelum modal/lanjut
function cleanInvalidTeams() {
  const filtered = localTeams.value.filter((t) => isValidTeam(t));
  localTeams.value = filtered.length ? filtered : [""];
  searchTexts.value = localTeams.value.map((v) => v || "");
  emitUpdate();
}

function handleNext() {
  if (!isFormValid.value) return;

  // pastikan baris hanya berisi tim valid
  cleanInvalidTeams();

  // tampilkan modal konfirmasi
  showConfirm.value = true;
}

function closeConfirm() {
  showConfirm.value = false;
}

function confirmAndEmit() {
  // sekali lagi pastikan hanya tim valid
  cleanInvalidTeams();
  showConfirm.value = false;
  emit("next");   // sinyal ke parent untuk tampilkan hasil Belbin
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
  margin-bottom: 1rem;
  color: #4b5563;
}

/* ===== PILIHAN TIM ===== */
.pref-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.pref-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pref-label {
  width: 100px;
  font-size: 0.9rem;
  color: #374151;
}

/* autocomplete wrapper */
.pref-autocomplete {
  position: relative;
  flex: 1;
  min-width: 0;
}

.pref-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
}

/* dropdown ala materialize */
.pref-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 220px;
  overflow-y: auto;
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
  list-style: none;
  padding: 0.25rem 0;
  z-index: 50;
}

.pref-group {
  padding: 0.3rem 0.75rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #9ca3af;
}

.pref-item {
  padding: 0.35rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.pref-item:hover {
  background: #e5f1ff;
}

.btn-remove {
  flex-shrink: 0;
  margin-left: 0.25rem;
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  border: none;
  background: #fee2e2;
  color: #b91c1c;
  cursor: pointer;
  font-size: 0.85rem;
}

/* tombol tambah di tengah */
.pref-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.btn-add {
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  border: none;
  background: #e5e7eb;
  color: #111827;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== TEXTAREA SARAN ===== */
.suggestion-block {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.suggestion-label {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 600;
}

.hashtag {
  color: #FF8B00;
}

.suggestion-textarea {
  width: 95%;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 0.9rem;
  resize: vertical;
}

/* ===== BUTTON ===== */
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
  font-size: 0.9rem;
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
  color: #6b7280;
}

/* ===== MODAL ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem 1.75rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
}

.modal-text {
  font-size: 0.9rem;
  color: #4b5563;
  margin: 0.5rem 0 0.75rem;
}

.modal-list {
  margin: 0 0 1rem;
  padding-left: 1.1rem;
  font-size: 0.9rem;
  color: #111827;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  background: #2563eb;
  color: white;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Spinner kecil di dalam tombol */
.spinner {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style>
