import assert from "node:assert/strict";
import test from "node:test";
import { bootstrapModule } from "../../bootstrap.js";

test("bootstrap registers owned settings, locales and preference provider", () => {
    const calls = [];
    bootstrapModule({
        moduleRoot: "/modules/fonts",
        moduleId: "fonts",
        registerStaticDir: (...args) => calls.push(["static", ...args]),
        registerSettingsSection: (section) => calls.push(["settings", section]),
        registerCapabilityProvider: (provider) =>
            calls.push(["provider", provider]),
    });
    assert.equal(calls.length, 3);
    const settings = calls.find(([type]) => type === "settings")[1];
    assert.equal(settings.label, "module.fonts.name");
    assert.equal(settings.stringsBaseUrl, "/static/modules/fonts/languages");
    assert.deepEqual(
        calls.find(([type]) => type === "provider")[1].providesCapabilities,
        ["fonts:preferences"],
    );
});
