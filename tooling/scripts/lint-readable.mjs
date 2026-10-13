import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const ignoredDirectories = new Set([".git", "node_modules"]);
const sourceExtensions = new Set([".js", ".mjs", ".css", ".html"]);
const violations = [];

function walk(directory) {
    for (const entry of readdirSync(directory)) {
        if (ignoredDirectories.has(entry)) continue;
        const path = join(directory, entry);
        if (statSync(path).isDirectory()) {
            walk(path);
            continue;
        }
        if (
            ![...sourceExtensions].some((extension) => path.endsWith(extension))
        ) {
            continue;
        }
        const source = readFileSync(path, "utf8");
        if (source.includes("\t")) {
            violations.push(
                `${relative(ROOT, path)}: contains tab indentation`,
            );
        }
        if (source.split("\n").length > 1000) {
            violations.push(`${relative(ROOT, path)}: exceeds 1000 lines`);
        }
    }
}

walk(ROOT);
if (violations.length > 0) {
    process.stderr.write(`${violations.join("\n")}\n`);
    process.exit(1);
}
