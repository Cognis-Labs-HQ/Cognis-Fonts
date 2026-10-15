import assert from "node:assert/strict";
import test from "node:test";

const calls = [];
const capabilities = new Map([
    [
        "ui:reuse",
        {
            importModule: async (path) => {
                if (path === "escape-html.js") return { escapeHtml: String };
                if (path === "font-prefs.js")
                    return {
                        DEFAULT_FONT: "Host Font",
                        DEFAULT_FONT_SIZE: 13,
                        toFontFamilyValue: (font) => `"${font}"`,
                        parseSavedFont: (font) => font ?? "Host Font",
                        loadFontsCatalog: async () => [
                            "Host Font",
                            "Dynamic Font",
                        ],
                    };
                if (path === "page-styles.js")
                    return {
                        ensurePageStylesheet: async (href) =>
                            assert.equal(
                                href,
                                "/static/modules/fonts/styles/fonts.css",
                            ),
                    };
                assert.equal(path, "ui-preferences.js");
                return {
                    loadUiPreferences: async () => ({
                        appFont: "Arial",
                        appFontSize: 14,
                    }),
                    saveUiPreferences: async (input) =>
                        calls.push(["save", input]),
                    applyUiPreferences: (input) => calls.push(["apply", input]),
                };
            },
        },
    ],
]);
globalThis[Symbol.for("cognis.uiCtx")] = {
    capabilities: { get: (id) => capabilities.get(id) },
};
const { mountProvider } = await import("../provider.js");

function scope() {
    const flows = new Map();
    const hooks = new Map();
    return {
        flows,
        registerFlow: (id, stages) => flows.set(id, stages),
        extendFlow: (id, stage, options, handler) => hooks.set(id, handler),
        capabilities: {
            contribute: (id, value) => capabilities.set(id, value),
        },
        async runFlow(id, input) {
            assert.deepEqual(flows.get(id), ["execute"]);
            const stage = { input, data: {} };
            await hooks.get(id)(stage);
            return stage;
        },
    };
}

test("import is inert and re-enable remounts preference flows", async () => {
    assert.equal(capabilities.has("fonts:preferences"), false);
    for (let cycle = 0; cycle < 2; cycle++) {
        const ctx = scope();
        mountProvider(ctx);
        const provider = capabilities.get("fonts:preferences");
        assert.deepEqual(await provider.load(), {
            appFont: "Arial",
            appFontSize: 14,
        });
        const input = { appFont: "Arial", appFontSize: 16 };
        await provider.save(input);
        assert.deepEqual(calls.slice(-2), [
            ["save", input],
            ["apply", input],
        ]);
        capabilities.delete("fonts:preferences");
    }
});

test("settings produce a host sub-composer and delegate save", async () => {
    mountProvider(scope());
    const { createSettingsSection } =
        await import("../settings-font-section.js");
    const section = await createSettingsSection({
        i18n: { t: (key) => key },
        root: {},
        markDirty() {},
    });
    assert.equal(section.subComposerOptions.elements.length, 1);
    await section.save();
    assert.equal(section.isDirty(), false);
    assert.equal(calls.at(-1)[0], "apply");
});

test("settings use the host font catalog and update the visible preview", async () => {
    mountProvider(scope());
    const { createSettingsSection } =
        await import("../settings-font-section.js");
    const elements = new Map(
        [
            "#module-fonts-mount",
            "#module-pref-font-select",
            "#module-pref-font-size-value",
            "#module-fonts-preview",
            "#module-pref-font-reset",
            "#module-pref-font-size-up",
            "#module-pref-font-size-down",
        ].map((selector) => [selector, { style: {} }]),
    );
    const section = await createSettingsSection({
        i18n: { t: (key) => key },
        root: { querySelector: (selector) => elements.get(selector) },
        markDirty() {},
    });
    section.subComposerOptions.onRender();
    await new Promise((resolve) => setImmediate(resolve));
    assert.match(elements.get("#module-fonts-mount").innerHTML, /Dynamic Font/);
    const picker = elements.get("#module-pref-font-select");
    picker.value = "Dynamic Font";
    picker.onchange();
    assert.equal(
        elements.get("#module-fonts-preview").style.fontFamily,
        '"Dynamic Font", Arial, sans-serif',
    );
    elements.get("#module-pref-font-reset").onclick();
    assert.equal(picker.value, "Host Font");
    assert.equal(elements.get("#module-fonts-preview").style.fontSize, "13pt");
    section.subComposerOptions.onUnmount();
    assert.equal(picker.onchange, null);
});

test("cached settings resolve the current preference provider after re-enable", async () => {
    const { createSettingsSection } =
        await import("../settings-font-section.js");
    const section = await createSettingsSection({
        i18n: { t: (key) => key },
        root: {},
        markDirty() {},
    });
    let saved;
    capabilities.set("fonts:preferences", {
        load: async () => ({ appFont: "Replacement", appFontSize: 15 }),
        save: async (input) => {
            saved = input;
        },
    });
    await section.save();
    assert.equal(saved.appFont, '"Replacement"');
    assert.equal(saved.appFontSize, 15);
});
