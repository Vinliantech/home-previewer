import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const required = ["index.html", ".htaccess", "sitemap.xml"];

for (const file of required) {
  await access(path.join(dist, file));
}

const assets = await readdir(path.join(dist, "assets"));
if (!assets.some((file) => file.endsWith(".js"))) {
  throw new Error("dist/assets does not contain a JavaScript bundle.");
}
if (!assets.some((file) => file.endsWith(".css"))) {
  throw new Error("dist/assets does not contain a CSS bundle.");
}

const html = await readFile(path.join(dist, "index.html"), "utf8");
if (!html.includes('id="root"')) {
  throw new Error("dist/index.html does not contain the React root.");
}

const forbidden = [
  /sb_secret_[A-Za-z0-9_-]{20,}/g,
  /\bre_[A-Za-z0-9_-]{20,}\b/g,
  /\bxkeysib-[A-Za-z0-9_-]{20,}\b/g,
  /\bEAA[A-Za-z0-9]{50,}\b/g,
  /SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*["'][^"']+["']/g,
];
for (const file of assets.filter((name) => name.endsWith(".js"))) {
  const contents = await readFile(path.join(dist, "assets", file), "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(contents)) {
      throw new Error(`Private secret name leaked into dist/assets/${file}.`);
    }
  }
}

console.log(
  `Static build verified: dist/index.html, dist/.htaccess and ${assets.length} asset files.`,
);
