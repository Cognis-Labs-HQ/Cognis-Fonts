import { renderFontPreferences } from "./templates/preferences.js";
const uiCtx = globalThis[Symbol.for("cognis.uiCtx")];
function getPreferences() {
    const preferences = uiCtx.capabilities.get("fonts:preferences");
    if (!preferences)
        throw new Error(
            "Required UI capability unavailable: fonts:preferences",
        );
    return preferences;
}

const loadPrefs = () => getPreferences().load();
const savePrefs = (input) => getPreferences().save(input);

const SECTION_ID = "module-fonts";
const [
    {
        DEFAULT_FONT,
        DEFAULT_FONT_SIZE,
        toFontFamilyValue,
        parseSavedFont,
        loadFontsCatalog,
    },
    { escapeHtml },
] = await Promise.all([
    uiCtx.capabilities.get("ui:reuse").importModule("font-prefs.js"),
    uiCtx.capabilities.get("ui:reuse").importModule("escape-html.js"),
]);

export async function createSettingsSection({ i18n, root, markDirty }) {
    const { ensurePageStylesheet } = await uiCtx.capabilities
        .get("ui:reuse")
        .importModule("page-styles.js");
    await ensurePageStylesheet("/static/modules/fonts/styles/fonts.css");
    let loadedPrefs = null;
    let loaded = false;
    let disposed = false;

    let savedFont = DEFAULT_FONT;
    let savedSize = DEFAULT_FONT_SIZE;
    let currentFont = DEFAULT_FONT;
    let currentSize = DEFAULT_FONT_SIZE;
    let availableFonts = [];

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
        loadedPrefs = await loadPrefs();

        const rawSize = Number(
            loadedPrefs?.appFontSize ??
                loadedPrefs?.greetingFontSize ??
                DEFAULT_FONT_SIZE,
        );
        const normalizedSize = rawSize < 8 ? Math.round(rawSize * 12) : rawSize;
        const normalizedFontSize = Math.max(
            8,
            Math.min(24, Math.round(normalizedSize)),
        );
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
        fontPreview = root.querySelector(`#${SECTION_ID}-preview`);
        resetButton = root.querySelector("#module-pref-font-reset");

        if (fontSelect) {
            fontSelect.onchange = () => {
                currentFont = fontSelect.value || DEFAULT_FONT;
                updatePreview();
                emitDirtyState();
            };
        }

        const sizeUpButton = root.querySelector("#module-pref-font-size-up");
        const sizeDownButton = root.querySelector(
            "#module-pref-font-size-down",
        );
        if (sizeUpButton)
            sizeUpButton.onclick = () => setFontSize(currentSize + 1);
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
        await ensureLoaded();

        availableFonts = await loadFontsCatalog();
        if (disposed) return;
        if (!availableFonts.includes(currentFont))
            availableFonts.unshift(currentFont);

        const fontOptions = availableFonts
            .map(
                (font) =>
                    `<option value="${escapeHtml(font)}" style="font-family:${escapeHtml(toFontFamilyValue(font))}, Arial, sans-serif">${escapeHtml(font)}</option>`,
            )
            .join("");

        const mountNode = root.querySelector(`#${SECTION_ID}-mount`);
        if (!mountNode) return;
        mountNode.innerHTML = renderFontPreferences({
            sectionId: SECTION_ID,
            fontOptions,
            i18n,
            escapeHtml,
        });

        connectDom();
        syncControlsToState();
    }

    return {
        id: "fonts",
        label: i18n.t("module.fonts.name"),
        subComposerOptions: {
            allowCustomization: false,
            preferenceKey: "settings-module-fonts-layout",
            heading: i18n.t("module.fonts.appearance"),
            elements: [
                {
                    id: "fonts-preferences",
                    label: i18n.t("module.fonts.name"),
                    render: () => `<div id="${SECTION_ID}-mount"></div>`,
                },
            ],
            onRender: () => {
                disposed = false;
                void renderIntoRoot().catch((error) => {
                    uiCtx.capabilities.get("ui:log")?.(
                        "error",
                        "Font preferences loading failed.",
                        {
                            component: "fonts",
                            operation: "loadPreferences",
                            errorName: error.name,
                        },
                    );
                });
            },
            onUnmount: () => {
                disposed = true;
                if (fontSelect) fontSelect.onchange = null;
                if (resetButton) resetButton.onclick = null;
            },
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
