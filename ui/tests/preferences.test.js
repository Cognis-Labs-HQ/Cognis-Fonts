import assert from "node:assert/strict";
import test from "node:test";

const calls = [];
const capabilities = new Map([
    [
        "ui:reuse",
        {
            importModule: async (path) => {
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
