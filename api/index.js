import path from "node:path";

const MODULE_ID = "fonts";

export function registerUi(ctx) {
    const moduleUiRoot = path.join(ctx.moduleRoot, "ui");

    ctx.registerStaticDir("", moduleUiRoot);
    ctx.registerSettingsSection({
        id: "module-fonts-appearance",
        label: "Font",
        scriptUrl: `/static/modules/${MODULE_ID}/settings-font-section.js`,
        access: { minRole: "user" },
    });
}
