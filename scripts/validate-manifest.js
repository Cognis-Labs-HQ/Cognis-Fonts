import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isAbsolute, resolve, sep } from "node:path";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const packageLock = JSON.parse(await readFile("package-lock.json", "utf8"));
assert.equal(
    manifest.version,
    packageJson.version,
    "manifest/package versions differ",
);
assert.equal(
    manifest.version,
    packageLock.version,
    "manifest/lock versions differ",
);
assert.match(
    manifest.uuid,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
);
assert.ok(
    Array.isArray(JSON.parse(await readFile("routes.json", "utf8"))),
    "routes.json must be an array",
);
const root = realpathSync(process.cwd());
const assetPaths = [
    manifest.assets?.icon,
    manifest.assets?.banner,
    ...(manifest.assets?.screenshots ?? []),
].filter((path) => path !== undefined);
for (const path of [...Object.values(manifest.entrypoints), ...assetPaths]) {
    assert.equal(typeof path, "string", "packaged target must be a path");
    const target = resolve(root, path);
    assert.ok(
        !isAbsolute(path) && target.startsWith(`${root}${sep}`),
        `packaged target escapes repository: ${path}`,
    );
    assert.ok(
        existsSync(target) && lstatSync(target).isFile(),
        `packaged target must be a regular file: ${path}`,
    );
    assert.ok(
        realpathSync(target).startsWith(`${root}${sep}`),
        `packaged target escapes repository: ${path}`,
    );
}
const expectedPaths = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" },
)
    .trim()
    .split("\n")
    .filter(
        (path) =>
            path &&
            path !== "manifest.json" &&
            path !== "README.md" &&
            !path.startsWith("docs/changelog/") &&
            existsSync(path) &&
            lstatSync(path).isFile(),
    )
    .sort();
const packagedPaths = manifest.files.map((file) => file.path).sort();
assert.deepEqual(
    packagedPaths,
    expectedPaths,
    "manifest inventory differs from repository files",
);
for (const file of manifest.files) {
    const digest = createHash("sha256")
        .update(await readFile(file.path))
        .digest("hex");
    assert.equal(digest, file.sha256, `digest mismatch: ${file.path}`);
}
console.log(`Validated ${manifest.files.length} packaged files.`);
