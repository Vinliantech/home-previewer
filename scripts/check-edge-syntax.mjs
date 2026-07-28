import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const functionRoot = path.resolve("supabase/functions");
const functionFiles = [];

function collectTypeScriptFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      collectTypeScriptFiles(filePath);
    } else if (entry.isFile() && filePath.endsWith(".ts")) {
      functionFiles.push(filePath);
    }
  }
}

collectTypeScriptFiles(functionRoot);

let errorCount = 0;
for (const filePath of functionFiles) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const diagnostic of sourceFile.parseDiagnostics) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    console.error(`${path.relative(process.cwd(), filePath)}: ${message}`);
    errorCount += 1;
  }
}

if (errorCount > 0) {
  process.exitCode = 1;
} else {
  console.log(`Edge syntax verified: ${functionFiles.length} TypeScript files.`);
}
