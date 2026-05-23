import path from "node:path";

export function registerUi(ctx) {
    const moduleUiRoot = path.join(ctx.moduleRoot, "ui");

    ctx.registerStaticDir("", moduleUiRoot);
    ctx.registerSettingsSection({
        id: "fonts",
        label: "Font",
        scriptUrl: "/static/modules/fonts/settings-font-section.js",
        access: { minRole: "user" },
    });
}
