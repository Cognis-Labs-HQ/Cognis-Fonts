import test from "node:test";
import assert from "node:assert/strict";
import {
    mkdtemp,
    mkdir,
    readFile,
    writeFile,
    symlink,
    rm,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const validator = new URL(
    "../../scripts/validate-manifest.js",
    import.meta.url,
);

for (const kind of ["missing", "directory", "symlink", "outside"]) {
    test(`manifest validation rejects ${kind} artwork before inventory checks`, async (context) => {
        const root = await mkdtemp(join(tmpdir(), "module-target-"));
        context.after(() => rm(root, { recursive: true, force: true }));
        const source = await readFile(validator, "utf8");
        await writeFile(join(root, "validate.mjs"), source);
        await writeFile(
            join(root, "bootstrap.js"),
            "export function bootstrapModule() {}\n",
        );
        let banner = "absent.png";
        if (kind === "directory") {
            banner = "artwork";
            await mkdir(join(root, banner));
        }
        if (kind === "symlink") {
            banner = "banner.png";
            await symlink("bootstrap.js", join(root, banner));
        }
        if (kind === "outside") banner = "../outside.png";
        await writeFile(
            join(root, "manifest.json"),
            JSON.stringify({
                version: "1.0.0",
                uuid: "d38f4cc5-6da2-470f-9b64-445a685c3991",
                entrypoints: { bootstrap: "bootstrap.js" },
                assets: { banner },
                files: [],
            }),
        );
        await writeFile(
            join(root, "package.json"),
            JSON.stringify({ version: "1.0.0" }),
        );
        await writeFile(
            join(root, "package-lock.json"),
            JSON.stringify({ version: "1.0.0" }),
        );
        await writeFile(join(root, "routes.json"), "[]");
        const result = spawnSync(process.execPath, ["validate.mjs"], {
            cwd: root,
            encoding: "utf8",
        });
        assert.ifError(result.error);
        assert.notEqual(result.status, 0);
        assert.match(
            result.stderr,
            /packaged target (must be a regular file|escapes repository)/,
        );
    });
}

test("developer documentation describes contracts without release numbers", async () => {
    const root = new URL("../../", import.meta.url);
    const { readdir } = await import("node:fs/promises");
    async function check(directory) {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
            if (entry.name === "changelog") continue;
            const path = new URL(entry.name, directory);
            if (entry.isDirectory())
                await check(new URL(`${entry.name}/`, directory));
            else if (entry.isFile() && entry.name.endsWith(".md")) {
                assert.doesNotMatch(
                    await readFile(path, "utf8"),
                    /\d+\.\d+\.\d+/,
                    `release number outside changelog: ${path.pathname}`,
                );
            }
        }
    }
    await check(new URL("docs/", root));
    for (const entry of await readdir(root, { withFileTypes: true })) {
        if (entry.isFile() && /^README\..+\.md$/.test(entry.name)) {
            assert.doesNotMatch(
                await readFile(new URL(entry.name, root), "utf8"),
                /\d+\.\d+\.\d+/,
                `release number outside changelog: ${entry.name}`,
            );
        }
    }
});
