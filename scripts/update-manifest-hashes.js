import { createHash } from "node:crypto";
import { existsSync, lstatSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { format, resolveConfig } from "prettier";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
const paths = execFileSync(
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
manifest.files = await Promise.all(
    paths.map(async (path) => ({
        path,
        sha256: createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
    })),
);
const prettierConfig = (await resolveConfig("manifest.json")) ?? {};
const formattedManifest = await format(JSON.stringify(manifest), {
    ...prettierConfig,
    parser: "json",
});
await writeFile("manifest.json", formattedManifest);
