import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateModuleStructure } from "../../scripts/module-structure.js";

test("module layout follows the template concern paths", async () => {
    assert.deepEqual(
        await validateModuleStructure(resolve(import.meta.dirname, "../..")),
        [],
    );
});

test("structure validation rejects misplaced CSS and flat route handlers", async (context) => {
    const root = await mkdtemp(join(tmpdir(), "module-structure-"));
    context.after(() => rm(root, { recursive: true, force: true }));
    for (const file of [
        "manifest.json",
        "package.json",
        "routes.json",
        "bootstrap.js",
    ])
        await writeFile(join(root, file), "{}");
    await mkdir(join(root, "ui/styles"), { recursive: true });
    await mkdir(join(root, "api/routes/example"), { recursive: true });
    await writeFile(join(root, "ui/styles/example.css"), "");
    await writeFile(join(root, "api/routes/example/index.js"), "");
    assert.deepEqual(await validateModuleStructure(root), []);
    await writeFile(join(root, "ui/example.css"), "");
    await writeFile(join(root, "api/example-routes.js"), "");
    assert.equal((await validateModuleStructure(root)).length, 2);
});
