import path from "node:path";

const MODULE_ID = "fonts";

export function registerUi(ctx) {
    const moduleUiRoot = path.join(ctx.moduleRoot, "ui");
    const moduleId = ctx.moduleId || MODULE_ID;

    ctx.registerStaticDir("", moduleUiRoot);
    ctx.registerCapabilityProvider({
        scriptUrl: `/static/modules/${moduleId}/provider.js`,
        providesCapabilities: ["fonts:preferences"],
        access: { minRole: "user" },
    });
    ctx.registerSettingsSection({
        id: "fonts",
        label: "module.fonts.name",
        scriptUrl: `/static/modules/${moduleId}/settings-font-section.js`,
        stringsBaseUrl: "/static/modules/fonts/languages",
        access: { minRole: "user" },
    });
}
