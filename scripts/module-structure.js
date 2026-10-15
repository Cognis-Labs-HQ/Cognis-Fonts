import { readdir, lstat } from "node:fs/promises";
import { join, relative } from "node:path";

export async function validateModuleStructure(root) {
    const failures = [];
    for (const name of [
        "manifest.json",
        "package.json",
        "routes.json",
        "bootstrap.js",
    ]) {
        try {
            if (!(await lstat(join(root, name))).isFile())
                failures.push(`${name} must be a regular file`);
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
            failures.push(`${name} is required`);
        }
    }
    async function scan(directory) {
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
            if (["node_modules", ".git"].includes(entry.name)) continue;
            const path = join(directory, entry.name);
            const name = relative(root, path).replaceAll("\\", "/");
            if (entry.isDirectory()) {
                if (
                    ["shared", "utils", "helpers", "common"].includes(
                        entry.name,
                    )
                )
                    failures.push(`${name}: use an owned reuse directory`);
                await scan(path);
            } else if (entry.isFile()) {
                if (name.endsWith(".css") && !name.startsWith("ui/styles/"))
                    failures.push(`${name}: styles belong under ui/styles/`);
                if (/^api\/[^/]+-routes?\.js$/.test(name))
                    failures.push(
                        `${name}: route handlers belong under api/routes/<domain>/`,
                    );
                if (
                    name.startsWith("api/routes/") &&
                    !/^api\/routes\/[^/]+\/.+/.test(name)
                )
                    failures.push(`${name}: routes need a domain directory`);
            }
        }
    }
    await scan(root);
    return failures;
}
