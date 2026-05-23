import path from "node:path";

const MODULE_ID = "fonts";

export function registerUi(ctx) {
    const moduleUiRoot = path.join(ctx.moduleRoot, "ui");
    const moduleId = ctx.moduleId || MODULE_ID;

    ctx.registerStaticDir("", moduleUiRoot);
    ctx.registerSettingsSection({
        id: "fonts",
        label: "Font",
        scriptUrl: `/static/modules/${moduleId}/settings-font-section.js`,
        access: { minRole: "user" },
    });
}
