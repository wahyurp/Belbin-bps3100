<template>
  <div class="segment-card">
    <h2>Preferensi Tim</h2>

    <!-- ===== PERTANYAAN 1: KONTRIBUSI OPTIMAL ===== -->
    <p class="segment-description">
      Saya merasa, saya dapat <b>berkontribusi dengan optimal</b> pada tim berikut
      (Pilih minimal 1, maksimal 3).
    </p>

    <div class="pref-section">
      <div
        class="pref-row"
        v-for="(value, idx) in localTeamsOptimal"
        :key="'opt-' + idx"
      >
        <label class="pref-label">
          Pilihan {{ idx + 1 }}
        </label>

        <div class="pref-autocomplete">
          <input
            type="text"
            class="pref-input"
            v-model="searchTextsOptimal[idx]"
            :placeholder="localTeamsOptimal[idx] || 'Ketik nama tim...'"
            @focus="openDropdown('optimal', idx)"
            @input="onSearchInput('optimal', idx)"
            @blur="handleBlur('optimal', idx)"
          />

          <!-- DROPDOWN -->
          <ul
            v-if="isDropdownOpen('optimal', idx) && hasAnyOption('optimal', idx)"
            class="pref-dropdown"
          >
            <li
              v-if="optionsProvForIndex('optimal', idx).length"
              class="pref-group"
            >
              BPS Provinsi
            </li>
            <li
              v-for="team in optionsProvForIndex('optimal', idx)"
              :key="'opt-prov-' + team"
              class="pref-item"
              @mousedown.prevent="selectOption('optimal', idx, team)"
            >
              {{ team }}
            </li>

            <li
              v-if="optionsKabkoForIndex('optimal', idx).length"
              class="pref-group"
            >
              BPS Kabupaten/Kota
            </li>
            <li
              v-for="team in optionsKabkoForIndex('optimal', idx)"
              :key="'opt-kab-' + team"
              class="pref-item"
              @mousedown.prevent="selectOption('optimal', idx, team)"
            >
              {{ team }}
            </li>
          </ul>
        </div>

        <button
          v-if="localTeamsOptimal.length > 1"
          type="button"
          class="btn-remove"
          @click="removeRow('optimal', idx)"
        >
          ✕
        </button>
      </div>

      <div class="pref-actions">
        <button
          v-if="localTeamsOptimal.length < 3"
          type="button"
          class="btn-add"
          :disabled="!canAddRowOptimal"
          @click="addRow('optimal')"
        >
          + Tambah pilihan
        </button>
      </div>
    </div>

    <hr class="pref-divider" />

    <!-- ===== PERTANYAAN 2: PALING NYAMAN ===== -->
    <p class="segment-description">
      Saya merasa, saya <b>paling nyaman</b> bekerja pada tim berikut
      (Pilih minimal 1, maksimal 3).
    </p>

    <div class="pref-section">
      <div
        class="pref-row"
        v-for="(value, idx) in localTeamsComfort"
        :key="'comfort-' + idx"
      >
        <label class="pref-label">
          Pilihan {{ idx + 1 }}
        </label>

        <div class="pref-autocomplete">
          <input
            type="text"
            class="pref-input"
            v-model="searchTextsComfort[idx]"
            :placeholder="localTeamsComfort[idx] || 'Ketik nama tim...'"
            @focus="openDropdown('comfort', idx)"
            @input="onSearchInput('comfort', idx)"
            @blur="handleBlur('comfort', idx)"
          />

          <!-- DROPDOWN -->
          <ul
            v-if="
              isDropdownOpen('comfort', idx) && hasAnyOption('comfort', idx)
            "
            class="pref-dropdown"
          >
            <li
              v-if="optionsProvForIndex('comfort', idx).length"
              class="pref-group"
            >
              BPS Provinsi
            </li>
            <li
              v-for="team in optionsProvForIndex('comfort', idx)"
              :key="'comfort-prov-' + team"
              class="pref-item"
              @mousedown.prevent="selectOption('comfort', idx, team)"
            >
              {{ team }}
            </li>

            <li
              v-if="optionsKabkoForIndex('comfort', idx).length"
              class="pref-group"
            >
              BPS Kabupaten/Kota
            </li>
            <li
              v-for="team in optionsKabkoForIndex('comfort', idx)"
              :key="'comfort-kab-' + team"
              class="pref-item"
              @mousedown.prevent="selectOption('comfort', idx, team)"
            >
              {{ team }}
            </li>
          </ul>
        </div>

        <button
          v-if="localTeamsComfort.length > 1"
          type="button"
          class="btn-remove"
          @click="removeRow('comfort', idx)"
        >
          ✕
        </button>
      </div>

      <div class="pref-actions">
        <button
          v-if="localTeamsComfort.length < 3"
          type="button"
          class="btn-add"
          :disabled="!canAddRowComfort"
          @click="addRow('comfort')"
        >
          + Tambah pilihan
        </button>
      </div>
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
        placeholder="Tulis saran, harapan, atau ide perbaikan (Opsional)..."
      ></textarea>
    </div>

    <!-- BUTTONS -->
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
          {{ isLast ? "Lihat Hasil" : "Lanjut" }}
        </template>
      </button>
    </div>

    <!-- HINT -->
    <p v-if="!hasValidOptimalTeam" class="hint">
      Pilih minimal 1 tim pada pertanyaan pertama.
    </p>
    <p v-else-if="!hasValidComfortTeam" class="hint">
      Pilih minimal 1 tim pada pertanyaan kedua.
    </p>

    <!-- ============ MODAL KONFIRMASI ============ -->
    <div v-if="showConfirm" class="modal-backdrop">
      <div class="modal-card">
        <h3>Konfirmasi Preferensi Tim</h3>
        <p class="modal-text">
          Berikut pilihan tim yang kamu isi. Pastikan sudah sesuai sebelum
          melihat hasil:
        </p>

        <div v-if="validTeamsOptimal.length">
          <strong>Pertanyaan 1 – Kontribusi optimal:</strong>
          <ul class="modal-list">
            <li v-for="(team, i) in validTeamsOptimal" :key="'m-opt-' + i">
              <strong>Pilihan {{ i + 1 }}:</strong> {{ team }}
            </li>
          </ul>
        </div>

        <div v-if="validTeamsComfort.length">
          <strong>Pertanyaan 2 – Paling nyaman bekerja:</strong>
          <ul class="modal-list">
            <li v-for="(team, i) in validTeamsComfort" :key="'m-comf-' + i">
              <strong>Pilihan {{ i + 1 }}:</strong> {{ team }}
            </li>
          </ul>
        </div>

        <p
          v-if="!validTeamsOptimal.length || !validTeamsComfort.length"
          class="modal-text"
        >
          Masih ada pertanyaan yang belum terisi dengan tim valid. Silakan
          periksa kembali.
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
            :disabled="
              !validTeamsOptimal.length ||
              !validTeamsComfort.length ||
              loading
            "
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
  "Kepala Kantor/Struktural",
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
  "Statistisi Ahli Madya BPS Kabupaten/Kota",
  "Sub Bagian Umum BPS Kabupaten/Kota",
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
    default: () => ({ teams: [], comfortTeams: [], suggestion: "" }),
  },
  showBack: {
    type: Boolean,
    default: true,
  },
  isLast: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "back", "next"]);

/* ===== STATE LOKAL ===== */
const localTeamsOptimal = ref([]);
const localTeamsComfort = ref([]);

const searchTextsOptimal = ref([]);
const searchTextsComfort = ref([]);

const suggestion = ref("");

const showConfirm = ref(false);

/* dropdown state */
const activeBlock = ref(null); // 'optimal' | 'comfort'
const activeIndex = ref(null);

/* ----- HELPER REFS PER BLOK ----- */
function getRefs(block) {
  if (block === "optimal") {
    return {
      teams: localTeamsOptimal,
      search: searchTextsOptimal,
    };
  }
  return {
    teams: localTeamsComfort,
    search: searchTextsComfort,
  };
}

/* ----- SYNC DARI PARENT ----- */
function syncFromModel() {
  const mv = props.modelValue || {};

  const opt = Array.isArray(mv.teams) ? mv.teams : [];
  const comf = Array.isArray(mv.comfortTeams) ? mv.comfortTeams : [];

  localTeamsOptimal.value = opt.slice(0, 3);
  if (!localTeamsOptimal.value.length) localTeamsOptimal.value = [""];

  localTeamsComfort.value = comf.slice(0, 3);
  if (!localTeamsComfort.value.length) localTeamsComfort.value = [""];

  searchTextsOptimal.value = localTeamsOptimal.value.map((v) => v || "");
  searchTextsComfort.value = localTeamsComfort.value.map((v) => v || "");

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
    teams: [...localTeamsOptimal.value],
    comfortTeams: [...localTeamsComfort.value],
    suggestion: suggestion.value,
  });
}

watch(suggestion, () => emitUpdate());

/* ===== VALIDATION ===== */
const hasValidOptimalTeam = computed(() =>
  localTeamsOptimal.value.some((val) => isValidTeam(val))
);
const hasValidComfortTeam = computed(() =>
  localTeamsComfort.value.some((val) => isValidTeam(val))
);

// const isSuggestionEnough = computed(
//   () => (suggestion.value || "").trim().length >= 50
// );

const isFormValid = computed(
  () =>
    hasValidOptimalTeam.value &&
    hasValidComfortTeam.value  
    // hasValidOptimalTeam.value &&
    // hasValidComfortTeam.value &&
    // isSuggestionEnough.value
);

const hasEmptyOrInvalidRowOptimal = computed(() =>
  localTeamsOptimal.value.some((val) => !isValidTeam(val))
);
const hasEmptyOrInvalidRowComfort = computed(() =>
  localTeamsComfort.value.some((val) => !isValidTeam(val))
);

const canAddRowOptimal = computed(
  () =>
    localTeamsOptimal.value.length < 3 &&
    !hasEmptyOrInvalidRowOptimal.value
);
const canAddRowComfort = computed(
  () =>
    localTeamsComfort.value.length < 3 &&
    !hasEmptyOrInvalidRowComfort.value
);

const validTeamsOptimal = computed(() =>
  localTeamsOptimal.value.filter((t) => isValidTeam(t))
);
const validTeamsComfort = computed(() =>
  localTeamsComfort.value.filter((t) => isValidTeam(t))
);

/* ===== AUTOCOMPLETE ===== */
function ensureSearchLength(block) {
  const { teams, search } = getRefs(block);
  if (search.value.length !== teams.value.length) {
    search.value = teams.value.map((v, i) =>
      search.value[i] !== undefined ? search.value[i] : v || ""
    );
  }
}

function selectedExceptIndex(block, idx) {
  const { teams } = getRefs(block);
  return teams.value
    .map((v, i) => (i === idx ? null : v || null))
    .filter((v) => v !== null);
}

function filteredList(baseList, block, idx) {
  ensureSearchLength(block);

  const { teams, search } = getRefs(block);
  const used = new Set(selectedExceptIndex(block, idx));
  const current = teams.value[idx] || "";
  const q = (search.value[idx] || "").toLowerCase().trim();

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

function optionsProvForIndex(block, idx) {
  return filteredList(TEAM_OPTIONS_PROV, block, idx);
}

function optionsKabkoForIndex(block, idx) {
  return filteredList(TEAM_OPTIONS_KABKO, block, idx);
}

function hasAnyOption(block, idx) {
  return (
    optionsProvForIndex(block, idx).length > 0 ||
    optionsKabkoForIndex(block, idx).length > 0
  );
}

function openDropdown(block, idx) {
  activeBlock.value = block;
  activeIndex.value = idx;
}

function isDropdownOpen(block, idx) {
  return activeBlock.value === block && activeIndex.value === idx;
}

function closeDropdownLater(block, idx) {
  setTimeout(() => {
    if (isDropdownOpen(block, idx)) {
      activeBlock.value = null;
      activeIndex.value = null;
    }
  }, 150);
}

function onSearchInput(block, idx) {
  const { teams, search } = getRefs(block);
  const text = (search.value[idx] || "").trim();
  if (!text) {
    teams.value[idx] = "";
    emitUpdate();
  }
  openDropdown(block, idx);
}

function handleBlur(block, idx) {
  const { teams, search } = getRefs(block);
  const currentTeam = teams.value[idx] || "";
  const currentSearch = search.value[idx] || "";

  if (currentSearch !== currentTeam) {
    search.value[idx] = currentTeam;
  }
  closeDropdownLater(block, idx);
}

function selectOption(block, idx, value) {
  const { teams, search } = getRefs(block);
  teams.value[idx] = value;
  search.value[idx] = value;
  activeBlock.value = null;
  activeIndex.value = null;
  emitUpdate();
}

/* ===== ROW ACTIONS ===== */
function addRow(block) {
  const { teams, search } = getRefs(block);
  const canAdd =
    block === "optimal" ? canAddRowOptimal.value : canAddRowComfort.value;
  if (!canAdd) return;
  teams.value.push("");
  search.value.push("");
  emitUpdate();
}

function removeRow(block, idx) {
  const { teams, search } = getRefs(block);
  teams.value.splice(idx, 1);
  search.value.splice(idx, 1);

  if (!teams.value.length) {
    teams.value.push("");
    search.value.push("");
  }
  emitUpdate();
}

/* ===== MODAL & NEXT ===== */
function cleanBlock(block) {
  const { teams, search } = getRefs(block);
  const filtered = teams.value.filter((t) => isValidTeam(t));
  teams.value = filtered.length ? filtered : [""];
  search.value = teams.value.map((v) => v || "");
}

function cleanInvalidTeams() {
  cleanBlock("optimal");
  cleanBlock("comfort");
  emitUpdate();
}

function handleNext() {
  if (!isFormValid.value) return;
  cleanInvalidTeams();
  showConfirm.value = true;
}

function closeConfirm() {
  showConfirm.value = false;
}

function confirmAndEmit() {
  cleanInvalidTeams();
  showConfirm.value = false;
  emit("next");
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

.pref-section {
  margin-bottom: 1rem;
}

.pref-divider {
  border: none;
  border-top: 1px dashed #e5e7eb;
  margin: 1rem 0 1.25rem;
}

/* ===== PILIHAN TIM ===== */
/* list pilihan: jarak antar row diperbesar */
.pref-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;        /* ❗ tadinya 0.75rem, bikin lebih lega */
  margin-bottom: 1.25rem;
}

/* masing-masing row juga boleh dikasih sedikit margin dan tidak terlalu nempel */
.pref-row {
  display: flex;
  align-items: center;
  gap: 1rem;           /* jarak label–input */
}

/* kalau mau lebih longgar lagi, bisa tambahkan: */
.pref-row + .pref-row {
  margin-top: 0.25rem; /* tambahan kecil di antara Pilihan 1 & 2 */
}


.pref-label {
  width: 100px;
  font-size: 0.9rem;
  color: #374151;
}

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
  margin-bottom: 0.75rem;
}

.btn-add {
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  border: none;
  background: #e5e7eb;
  color: #111827;
  font-weight: 600;
  margin-top: 1%;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== TEXTAREA SARAN ===== */
.suggestion-block {
  margin-top: 0.5rem;
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
  color: #ff8b00;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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
  color: #b91c1c;
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
