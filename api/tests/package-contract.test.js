import assert from "node:assert/strict";
import test from "node:test";
import { readFile, lstat } from "node:fs/promises";
import { createHash } from "node:crypto";

const root = new URL("../../", import.meta.url);
const readJson = async (name) =>
    JSON.parse(await readFile(new URL(name, root), "utf8"));

test("module metadata, localized descriptors and package digests are consistent", async () => {
    const manifest = await readJson("manifest.json");
    const packageJson = await readJson("package.json");
    const lock = await readJson("package-lock.json");
    assert.equal(manifest.version, packageJson.version);
    assert.equal(manifest.version, lock.version);
    assert.match(manifest.uuid, /^[0-9a-f-]{36}$/);
    assert.ok(Array.isArray(await readJson("routes.json")));
    let referenceKeys;
    for (const locale of ["de", "en", "id", "ja"]) {
        const xml = await readFile(
            new URL(`ui/languages/${locale}/strings.xml`, root),
            "utf8",
        );
        const keys = [...xml.matchAll(/<string name="([^"]+)"/g)].map(
            (match) => match[1],
        );
        if (referenceKeys) assert.deepEqual(keys, referenceKeys);
        referenceKeys = keys;
        for (const key of keys) assert.match(key, /^module(?:\.[a-z0-9]+)+$/);
        for (const field of ["name", "summary", "description"])
            assert.ok(keys.includes(manifest[field]));
        assert.ok(
            (
                await readFile(new URL(`docs/index.${locale}.md`, root), "utf8")
            ).includes("mountProvider"),
        );
    }
    for (const entry of Object.values(manifest.entrypoints))
        assert.ok((await lstat(new URL(entry, root))).isFile());
    for (const file of manifest.files) {
        assert.ok((await lstat(new URL(file.path, root))).isFile());
        assert.equal(
            createHash("sha256")
                .update(await readFile(new URL(file.path, root)))
                .digest("hex"),
            file.sha256,
        );
        assert.notEqual(file.path, "manifest.json");
        assert.notEqual(file.path, "README.md");
        assert.ok(!file.path.startsWith("docs/changelog/"));
    }
});
