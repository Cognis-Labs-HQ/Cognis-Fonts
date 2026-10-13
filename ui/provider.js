const uiCtx = globalThis[Symbol.for("cognis.uiCtx")];
const reuse = uiCtx?.capabilities.get("ui:reuse");
if (!reuse) throw new Error("Required UI capability unavailable: ui:reuse");
const preferences = await reuse.importModule("ui-preferences.js");

export function mountProvider(ctx) {
    const operations = {
        load: () => preferences.loadUiPreferences(),
        save: async (input) => {
            await preferences.saveUiPreferences(input);
            preferences.applyUiPreferences(input);
        },
    };
    for (const [action, execute] of Object.entries(operations)) {
        const flowId = `fonts:${action}Preferences`;
        ctx.registerFlow(flowId, ["execute"]);
        ctx.extendFlow(flowId, "execute", { id: flowId }, async (stage) => {
            stage.data.result = await execute(stage.input);
        });
    }
    ctx.capabilities.contribute("fonts:preferences", {
        async load() {
            return (await ctx.runFlow("fonts:loadPreferences")).data.result;
        },
        async save(input) {
            await ctx.runFlow("fonts:savePreferences", input);
        },
    });
}
