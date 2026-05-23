const SECTION_ID = "module-fonts";
const DEFAULT_FONT = "Orbitron";
const DEFAULT_FONT_SIZE = 12;
const MODULE_FONTS = ["Orbitron", "Audiowide", "Inter", "Arial", "sans-serif"];

function translate(i18n, key, fallback) {
    const value = i18n?.t?.(key);
    return value && value !== key ? value : fallback;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function toFontFamilyValue(font) {
    if (!font) return DEFAULT_FONT;
    return /^[a-zA-Z0-9-]+$/.test(font)
        ? font
        : `"${font.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseSavedFont(fontValue) {
    if (!fontValue || typeof fontValue !== "string") return DEFAULT_FONT;
    return (
        fontValue
            .split(",")[0]
            .trim()
            .replace(/^['"]|['"]$/g, "") || DEFAULT_FONT
    );
}

async function apiFetch(url, options = {}) {
    return fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            "content-type": "application/json",
            ...(options.headers || {}),
        },
    });
}

async function loadPrefs() {
    const account = localStorage.getItem("cognis_account");
    if (!account) return null;
    const response = await apiFetch(
        `/api/v1/users/${encodeURIComponent(account)}/preferences/ui-preferences`,
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const raw = payload?.data?.layoutJson;
    return raw ? JSON.parse(raw) : null;
}

async function savePrefs(prefs) {
    const account = localStorage.getItem("cognis_account");
    if (!account) return;
    await apiFetch(
        `/api/v1/users/${encodeURIComponent(account)}/preferences/ui-preferences`,
        {
            method: "PUT",
            body: JSON.stringify({ layout: prefs }),
        },
    );
}

function applyUiPreferences(prefs) {
    const fontFamily = prefs?.appFont;
    if (fontFamily) {
        document.documentElement.style.setProperty("--app-font", fontFamily);
    }

    function readStoredUiPrefs() {
        try {
            return JSON.parse(localStorage.getItem("cognis_ui_preferences") || "{}");
        } catch {
            return {};
        }
    }
    const rawSize = prefs?.appFontSize;
    if (rawSize != null) {
        const size = Number(rawSize);
        const ptSize = size < 8 ? Math.round(size * 12) : size;
        document.documentElement.style.setProperty("--app-font-size", `${ptSize}pt`);
    }
}

async function loadFontsCatalog() {
    await document.fonts?.ready;
    const seen = new Set(MODULE_FONTS);
    document.fonts?.forEach((face) => {
        const family = face.family.replace(/^['"]|['"]$/g, "").trim();
        if (family) seen.add(family);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function ensureFontFaceStyles() {
    if (document.querySelector('link[data-module-font-faces="true"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/static/modules/fonts/font-faces.css";
    link.dataset.moduleFontFaces = "true";
    document.head.append(link);
}

export function createSettingsSection({ i18n, root, markDirty }) {
    let loadedPrefs = null;
    let loaded = false;

    let savedFont = DEFAULT_FONT;
    let savedSize = DEFAULT_FONT_SIZE;
    let currentFont = DEFAULT_FONT;
    let currentSize = DEFAULT_FONT_SIZE;
    let availableFonts = [...MODULE_FONTS];

    let fontSelect = null;
    let fontSizeValue = null;
    let fontPreview = null;
    let resetButton = null;

    function isDirty() {
        return currentFont !== savedFont || currentSize !== savedSize;
    }

    function emitDirtyState() {
        const dirty = isDirty();
        markDirty?.(SECTION_ID, dirty);
        if (resetButton) resetButton.disabled = !dirty;
    }

    function updatePreview() {
        if (!fontPreview) return;
        fontPreview.style.fontFamily = `${toFontFamilyValue(currentFont)}, Arial, sans-serif`;
        fontPreview.style.fontSize = `${currentSize}pt`;
    }

    function updateSizeLabel() {
        if (!fontSizeValue) return;
        fontSizeValue.textContent = `${currentSize} pt`;
    }

    function setFontSize(size) {
        currentSize = Math.max(8, Math.min(24, Math.round(size)));
        updateSizeLabel();
        updatePreview();
        emitDirtyState();
    }

    function syncControlsToState() {
        if (fontSelect) fontSelect.value = currentFont;
        updateSizeLabel();
        updatePreview();
        emitDirtyState();
    }

    async function ensureLoaded() {
        if (loaded) return;
        loadedPrefs = await loadPrefs().catch(() => null);

        const rawSize = Number(
            loadedPrefs?.appFontSize ??
                loadedPrefs?.greetingFontSize ??
                DEFAULT_FONT_SIZE,
        );
        const normalizedSize = rawSize < 8 ? Math.round(rawSize * 12) : rawSize;
        const normalizedFontSize = Math.max(8, Math.min(24, Math.round(normalizedSize)));
        const normalizedFont = parseSavedFont(
            loadedPrefs?.appFont || loadedPrefs?.greetingFont,
        );

        savedFont = normalizedFont;
        currentFont = normalizedFont;
        savedSize = normalizedFontSize;
        currentSize = normalizedFontSize;

        loaded = true;
    }

    function connectDom() {
        fontSelect = root.querySelector("#module-pref-font-select");
        fontSizeValue = root.querySelector("#module-pref-font-size-value");
        fontPreview = root.querySelector("#module-pref-font-preview");
        resetButton = root.querySelector("#module-pref-font-reset");

        if (fontSelect) {
            fontSelect.onchange = () => {
                currentFont = fontSelect.value || DEFAULT_FONT;
                updatePreview();
                emitDirtyState();
            };
        }

        const sizeUpButton = root.querySelector("#module-pref-font-size-up");
        const sizeDownButton = root.querySelector("#module-pref-font-size-down");
        if (sizeUpButton) sizeUpButton.onclick = () => setFontSize(currentSize + 1);
        if (sizeDownButton)
            sizeDownButton.onclick = () => setFontSize(currentSize - 1);
        if (resetButton) {
            resetButton.onclick = () => {
                currentFont = DEFAULT_FONT;
                currentSize = DEFAULT_FONT_SIZE;
                syncControlsToState();
            };
        }
    }

    async function renderIntoRoot() {
        ensureFontFaceStyles();
        await ensureLoaded();

        availableFonts = await loadFontsCatalog().catch(() => [...MODULE_FONTS]);
        if (!availableFonts.includes(currentFont)) availableFonts.unshift(currentFont);

        const fontOptions = availableFonts
            .map(
                (font) =>
                    `<option value="${escapeHtml(font)}" style="font-family:${escapeHtml(toFontFamilyValue(font))}, Arial, sans-serif">${escapeHtml(font)}</option>`,
            )
            .join("");

        const fontLabel = translate(i18n, "ui.app.settings.font", "Font");
        const fontSizeLabel = translate(i18n, "ui.app.settings.font_size", "Font size");
        const previewLabel = translate(
            i18n,
            "ui.app.settings.font_preview",
            "Font preview",
        );
        const previewSample = translate(
            i18n,
            "ui.app.settings.font_preview_sample",
            "The quick brown fox jumps over the lazy dog.",
        );
        const resetLabel = translate(i18n, "ui.reuse.reset", "Reset");

        const mountNode = root.querySelector(`#${SECTION_ID}-mount`);
        if (!mountNode) return;

        mountNode.innerHTML = `
      <div class="font-heading-row">
        <h3>${escapeHtml(fontLabel)}</h3>
        <button id="module-pref-font-reset" type="button">${escapeHtml(resetLabel)}</button>
      </div>
      <div class="font-picker-row">
        <label class="font-picker-label">
          ${escapeHtml(fontLabel)}
          <select id="module-pref-font-select" class="theme-select">${fontOptions}</select>
        </label>
        <div class="font-size-stepper">
          <button id="module-pref-font-size-up" class="font-size-btn" type="button" aria-label="${escapeHtml(fontSizeLabel)} +">▲</button>
          <span id="module-pref-font-size-value"></span>
          <button id="module-pref-font-size-down" class="font-size-btn" type="button" aria-label="${escapeHtml(fontSizeLabel)} -">▼</button>
        </div>
      </div>
      <div class="font-preview-box">
        <h4>${escapeHtml(previewLabel)}</h4>
        <span id="module-pref-font-preview">${escapeHtml(previewSample)}</span>
      </div>
    `;

        connectDom();
        syncControlsToState();
    }

    return {
        id: "module-fonts-appearance",
        label: translate(i18n, "ui.app.settings.font", "Font"),
        preferenceKey: "settings-module-fonts-layout",
        heading: translate(i18n, "ui.reuse.appearance", "Appearance"),
        renderContent: () => `<div id="${SECTION_ID}-mount"></div>`,
        onRender: () => {
            void renderIntoRoot();
        },
        isDirty,
        save: async () => {
            await ensureLoaded();
            const mergedPrefs = {
                ...(loadedPrefs || {}),
                appFont: toFontFamilyValue(currentFont),
                appFontSize: currentSize,
            };
            await savePrefs(mergedPrefs);
            loadedPrefs = mergedPrefs;
            applyUiPreferences(mergedPrefs);
            const existing = readStoredUiPrefs();
            localStorage.setItem(
                "cognis_ui_preferences",
                JSON.stringify({ ...existing, ...mergedPrefs }),
            );
            savedFont = currentFont;
            savedSize = currentSize;
            emitDirtyState();
        },
        commit: () => {
            savedFont = currentFont;
            savedSize = currentSize;
            emitDirtyState();
        },
        discard: () => {
            currentFont = savedFont;
            currentSize = savedSize;
            syncControlsToState();
        },
    };
}
