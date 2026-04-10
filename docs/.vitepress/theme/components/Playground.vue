<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import titlefx from "titlefx";
import { clampCount } from "../../../../src/clamp";
import type { TitlePresetName } from "../../../../src/preset";
import { examples } from "./playground-examples";

const activeId = ref(examples[0]?.id ?? "");
const appliedTitle = ref("");
const copyLabel = ref("Copy");

const draft = reactive<Record<string, unknown>>({});
let titleFrameId: number | null = null;

const activeExample = computed(
  () => examples.find((example) => example.id === activeId.value) ?? examples[0],
);

const showCountControls = computed(() => {
  const preset = activeExample.value.preset;
  return preset === "notifications" || preset === "progress";
});

/** Classes for the mock tab favicon dot (mirrors real favicon badge colors). */
const tabStatusPreviewClass = computed(() => {
  const s = draft.status;
  if (s === true || s === "warning") return ["has-status-dot", "has-status-dot--warning"];
  if (s === "error") return ["has-status-dot", "has-status-dot--error"];
  if (s === "info") return ["has-status-dot", "has-status-dot--info"];
  return [];
});

function loadDraftFromExample() {
  const ex = activeExample.value;
  for (const key of Object.keys(draft)) {
    delete draft[key];
  }
  Object.assign(draft, JSON.parse(JSON.stringify(ex.options)) as Record<string, unknown>);
  if (!("status" in draft)) draft.status = "";
}

const codeSnippet = computed(() => {
  const example = activeExample.value;
  const entries = Object.entries(draft)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `  ${key}: ${JSON.stringify(value)},`);

  return [
    'import titlefx from "titlefx";',
    "",
    `titlefx.preset(${JSON.stringify(example.preset)}, {`,
    ...entries,
    "});",
  ].join("\n");
});

const browserTabTitle = computed(() => appliedTitle.value || "New tab");

function syncAppliedTitle() {
  if (typeof document === "undefined") return;
  appliedTitle.value = document.title;
}

function buildOptionsFromDraft(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft)) {
    if (value === undefined || value === "") continue;
    out[key] = value;
  }
  return out;
}

function applyDraft() {
  const example = activeExample.value;
  const options = buildOptionsFromDraft();
  appliedTitle.value = titlefx.preset(example.preset as never, options as never);
  syncAppliedTitle();
}

function applyExample(id = activeId.value) {
  activeId.value = id;
  loadDraftFromExample();
  applyDraft();
}

const presetOptions: { value: TitlePresetName; label: string }[] = [
  { value: "default", label: "default" },
  { value: "media", label: "media" },
  { value: "notifications", label: "notifications" },
  { value: "progress", label: "progress" },
  { value: "custom", label: "custom" },
];

const selectedPresetModel = computed<TitlePresetName>({
  get: () => activeExample.value.preset,
  set(preset) {
    const example = examples.find((entry) => entry.preset === preset);
    if (example) applyExample(example.id);
  },
});

function resetDraftToExample() {
  loadDraftFromExample();
  applyDraft();
}

function bumpCount(delta: number) {
  if (!showCountControls.value) return;
  draft.count = clampCount(Number(draft.count ?? 0) + delta);
  applyDraft();
}

function setCountFromInput(raw: string) {
  draft.count = clampCount(Number(raw));
  applyDraft();
}

function resetTitle() {
  titlefx.dispose();
  syncAppliedTitle();
}

async function copySnippet() {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;

  await navigator.clipboard.writeText(codeSnippet.value);
  copyLabel.value = "Copied";

  window.setTimeout(() => {
    copyLabel.value = "Copy";
  }, 1200);
}

function startTitleMirrorLoop() {
  if (typeof window === "undefined") return;

  const tick = () => {
    syncAppliedTitle();
    titleFrameId = window.requestAnimationFrame(tick);
  };

  titleFrameId = window.requestAnimationFrame(tick);
}

onMounted(() => {
  applyExample(activeId.value);
  startTitleMirrorLoop();
});

onUnmounted(() => {
  if (titleFrameId !== null) {
    window.cancelAnimationFrame(titleFrameId);
    titleFrameId = null;
  }
  titlefx.dispose();
});
</script>

<template>
  <div class="playground">
    <section class="playground-top">
      <section class="snippet-band">
        <div class="snippet-header">
          <div class="section-title"></div>
        </div>

        <div class="snippet-shell">
          <button type="button" class="copy-btn" @click="copySnippet">{{ copyLabel }}</button>
          <pre class="code-block"><code>{{ codeSnippet }}</code></pre>
        </div>
      </section>

      <section class="preview-band">
        <div class="browser-mockup">
          <div class="browser-topbar">
            <div class="window-actions" aria-hidden="true">
              <span class="window-dot close" />
              <span class="window-dot minimize" />
              <span class="window-dot maximize" />
            </div>
            <div class="browser-tabs" role="tablist" aria-label="Tab preview">
              <div class="browser-tab active" role="tab" aria-selected="true">
                <span class="tab-favicon" :class="tabStatusPreviewClass" />
                <span class="tab-title">{{ browserTabTitle }}</span>
                <span class="tab-close">×</span>
              </div>
            </div>
          </div>

          <div class="browser-toolbar">
            <div class="toolbar-nav">
              <span class="nav-btn">‹</span>
              <span class="nav-btn">›</span>
              <span class="nav-btn">↻</span>
            </div>
            <div class="address-bar">https://app.example.com</div>
          </div>

          <div class="browser-canvas">
            <div class="canvas-title">{{ activeExample.label }}</div>
          </div>
        </div>
      </section>
    </section>

    <section class="tweak-panel">
      <div class="tweak-header">
        <h3 class="section-title">Adjust values</h3>
        <div class="tweak-actions">
          <button type="button" class="primary-btn" @click="applyDraft">Apply</button>
          <button type="button" class="ghost-btn" @click="resetDraftToExample">
            Reset example
          </button>
        </div>
      </div>

      <div class="examples-grid" role="tablist" aria-label="Examples">
        <button
          v-for="example in examples"
          :key="example.id"
          type="button"
          class="example-tile"
          :class="{ active: example.id === activeId }"
          :aria-selected="example.id === activeId"
          @click="applyExample(example.id)"
        >
          <span class="tile-label">{{ example.label }}</span>
        </button>
      </div>

      <div class="field-grid">
        <label class="field">
          <span class="field-label">Preset</span>
          <select v-model="selectedPresetModel" class="field-input">
            <option v-for="opt in presetOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </label>

        <template v-if="activeExample.preset === 'default'">
          <label class="field">
            <span class="field-label">Context / title</span>
            <input v-model="draft.context" type="text" class="field-input" placeholder="Homepage" />
          </label>
          <label class="field">
            <span class="field-label">Brand</span>
            <input v-model="draft.brand" type="text" class="field-input" placeholder="My site" />
          </label>
          <label class="field">
            <span class="field-label">Separator</span>
            <input v-model="draft.separator" type="text" class="field-input" placeholder="- (leave empty for default)" />
          </label>
          <label class="field">
            <span class="field-label">Prefix</span>
            <input v-model="draft.prefix" type="text" class="field-input" placeholder="text or emoji" />
          </label>
          <label class="field">
            <span class="field-label">Suffix</span>
            <input v-model="draft.suffix" type="text" class="field-input" />
          </label>
        </template>

        <template v-else-if="activeExample.preset === 'media'">
          <label class="field">
            <span class="field-label">Content</span>
            <input v-model="draft.content" type="text" class="field-input" placeholder="Blinding Lights" />
          </label>
          <label class="field">
            <span class="field-label">Author</span>
            <input v-model="draft.author" type="text" class="field-input" placeholder="The Weeknd" />
          </label>
          <label class="field">
            <span class="field-label">Brand</span>
            <input v-model="draft.brand" type="text" class="field-input" placeholder="Spotify" />
          </label>
          <label class="field">
            <span class="field-label">Prefix</span>
            <input v-model="draft.prefix" type="text" class="field-input" />
          </label>
          <label class="field">
            <span class="field-label">Suffix</span>
            <input v-model="draft.suffix" type="text" class="field-input" />
          </label>
        </template>

        <template v-else-if="activeExample.preset === 'custom'">
          <label class="field field-span-2">
            <span class="field-label">Template</span>
            <input
              v-model="draft.template"
              type="text"
              class="field-input"
              placeholder="Inbox ({count}) - {email} - {brand}"
            />
          </label>
          <label class="field">
            <span class="field-label">Count</span>
            <input v-model="draft.count" type="text" class="field-input" placeholder="8.456" />
          </label>
          <label class="field">
            <span class="field-label">Email</span>
            <input v-model="draft.email" type="text" class="field-input" placeholder="me@example.com" />
          </label>
          <label class="field">
            <span class="field-label">Brand</span>
            <input v-model="draft.brand" type="text" class="field-input" placeholder="Gmail" />
          </label>
          <label class="field">
            <span class="field-label">Prefix</span>
            <input v-model="draft.prefix" type="text" class="field-input" />
          </label>
          <label class="field">
            <span class="field-label">Suffix</span>
            <input v-model="draft.suffix" type="text" class="field-input" />
          </label>
        </template>

        <template v-else-if="activeExample.preset === 'notifications' || activeExample.preset === 'progress'">
          <div class="field field-count">
            <span class="field-label">Count</span>
            <div class="count-row">
              <button type="button" class="stepper-btn" aria-label="Decrease" @click="bumpCount(-1)">
                −
              </button>
              <input
                class="field-input count-input"
                type="number"
                min="0"
                step="1"
                :value="draft.count ?? 0"
                @input="setCountFromInput(($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="stepper-btn" aria-label="Increase" @click="bumpCount(1)">
                +
              </button>
            </div>
          </div>
          <label class="field">
            <span class="field-label">Brand</span>
            <input v-model="draft.brand" type="text" class="field-input" />
          </label>
          <label class="field">
            <span class="field-label">Context</span>
            <input v-model="draft.context" type="text" class="field-input" />
          </label>
          <label class="field">
            <span class="field-label">Separator</span>
            <input v-model="draft.separator" type="text" class="field-input" placeholder="• (leave empty for default)" />
          </label>
          <label class="field">
            <span class="field-label">Prefix</span>
            <input v-model="draft.prefix" type="text" class="field-input" />
          </label>
          <label class="field">
            <span class="field-label">Suffix</span>
            <input v-model="draft.suffix" type="text" class="field-input" />
          </label>
        </template>

        <label class="field">
          <span class="field-label">Status (favicon)</span>
          <select v-model="draft.status" class="field-input">
            <option value="">off</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
            <option value="info">info</option>
          </select>
        </label>

        <label class="field field-toggle">
          <span class="field-label">Animate</span>
          <label class="toggle-row">
            <input v-model="draft.animate" type="checkbox" class="toggle-input" />
            <span class="toggle-switch" aria-hidden="true">
              <span class="toggle-thumb" />
            </span>
          </label>
        </label>

        <label class="field">
          <span class="field-label">Animation</span>
          <select v-model="draft.animation" class="field-input">
            <option value=""></option>
            <option value="loop">loop</option>
            <option value="bounce">bounce</option>
            <option value="blink">blink</option>
          </select>
        </label>

        <label class="field">
          <span class="field-label">Speed</span>
          <select v-model="draft.speed" class="field-input">
            <option value=""></option>
            <option value="slow">slow</option>
            <option value="normal">normal</option>
            <option value="fast">fast</option>
          </select>
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.playground {
  margin-top: 1rem;
}

.playground-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.preview-band,
.snippet-band,
.tweak-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.playground-top .preview-band,
.playground-top .snippet-band {
  margin-top: 0;
}

.browser-mockup {
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: #cfd6e4;
}

.browser-topbar {
  padding: 0.5rem 0.55rem 0;
  background: #d9dfeb;
}

.window-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.window-dot {
  width: 0.68rem;
  height: 0.68rem;
  border-radius: 999px;
}

.window-dot.close {
  background: #ff5f57;
}

.window-dot.minimize {
  background: #febc2e;
}

.window-dot.maximize {
  background: #28c840;
}

.browser-tabs {
  display: flex;
  align-items: flex-end;
  gap: 0.3rem;
  overflow-x: auto;
}

.browser-tab {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  max-width: 17.9rem;
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid transparent;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: rgba(255, 255, 255, 0.42);
  color: #334155;
}

.browser-tab.active {
  background: #ffffff;
  border-color: #cfd6e4;
  border-bottom-color: #ffffff;
  color: #0f172a;
}

.tab-favicon {
  position: relative;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 3px;
  background: linear-gradient(135deg, #22c55e, #38bdf8);
  flex: 0 0 auto;
}

.tab-favicon.has-status-dot::after {
  content: "";
  position: absolute;
  right: -0.05rem;
  bottom: -0.05rem;
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  border: 0.5px solid #fff;
  box-sizing: border-box;
}

.tab-favicon.has-status-dot--warning::after {
  background: #facc15;
}

.tab-favicon.has-status-dot--error::after {
  background: #dc2626;
}

.tab-favicon.has-status-dot--info::after {
  background: #3b82f6;
}

.tab-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
}

.tab-close {
  flex: 0 0 auto;
  color: #64748b;
}

.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem;
  border-top: 1px solid #cfd6e4;
  background: #ffffff;
}

.toolbar-nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.nav-btn {
  width: 1.8rem;
  height: 1.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  font-size: 0.9rem;
}

.address-bar {
  min-width: 0;
  flex: 1;
  padding: 0.5rem 0.7rem;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.84rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-canvas {
  min-height: 4.25rem;
  padding: 1.25rem 1rem;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.98));
}

.canvas-title {
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
}

.examples-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.example-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.55rem 0.9rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    transform 0.15s ease;
}

.example-tile:hover {
  border-color: var(--vp-c-brand-2);
  transform: translateY(-1px);
}

.example-tile.active {
  border-color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, var(--vp-c-bg));
}

.tile-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: inherit;
}

.tweak-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.tweak-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.85rem 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.field-span-2 {
  grid-column: span 2;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.field-input {
  width: 100%;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-size: 0.92rem;
}

.field-input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--vp-c-brand-1) 25%, transparent);
}

.field-count .count-row {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
}

.field-toggle {
  justify-content: flex-end;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.4rem;
  color: var(--vp-c-text-1);
  font-size: 0.92rem;
}

.toggle-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-switch {
  position: relative;
  width: 2.5rem;
  height: 1.45rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-text-3) 35%, transparent);
  transition: background-color 0.18s ease;
}

.toggle-thumb {
  position: absolute;
  top: 0.15rem;
  left: 0.15rem;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.25);
  transition: transform 0.18s ease;
}

.toggle-input:checked + .toggle-switch {
  background: var(--vp-c-brand-1);
}

.toggle-input:checked + .toggle-switch .toggle-thumb {
  transform: translateX(1.05rem);
}

.count-input {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.stepper-btn {
  flex: 0 0 auto;
  width: 2.25rem;
  padding: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}

.stepper-btn:hover {
  border-color: var(--vp-c-brand-2);
}

.primary-btn {
  padding: 0.45rem 0.95rem;
  border: none;
  border-radius: 6px;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.primary-btn:hover {
  opacity: 0.92;
}

.snippet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.snippet-shell {
  position: relative;
}

.section-title {
  margin: 0;
  font-size: 0.95rem;
}

.ghost-btn {
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font: inherit;
}

.ghost-btn:hover {
  border-color: var(--vp-c-brand-2);
}

.copy-btn {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  z-index: 1;
  padding: 0.4rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.82);
  color: #e5eefc;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
}

.copy-btn:hover {
  background: rgba(15, 23, 42, 0.94);
}

.code-block {
  margin: 0.9rem 0 0;
  height: 18rem;
  padding: 3rem 0.95rem 0.95rem;
  border-radius: 8px;
  background: #0f172a;
  color: #e5eefc;
  overflow: auto;
  font-size: 0.86rem;
  line-height: 1.55;
}

@media (max-width: 640px) {
  .playground-top {
    grid-template-columns: 1fr;
  }

  .snippet-header,
  .tweak-header {
    align-items: stretch;
    flex-direction: column;
  }

  .ghost-btn,
  .primary-btn {
    width: 100%;
  }

  .tweak-actions {
    width: 100%;
  }

  .tweak-actions .ghost-btn,
  .tweak-actions .primary-btn {
    flex: 1;
  }

  .browser-tab {
    flex-basis: 9rem;
  }

  .field-span-2 {
    grid-column: span 1;
  }
}
</style>
