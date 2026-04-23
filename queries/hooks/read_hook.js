import { appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  try {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString();

    if (!raw.trim()) {
      // Empty stdin — allow and continue
      process.exit(0);
    }

    const toolArgs = JSON.parse(raw);
    const input = toolArgs.tool_input || {};

    // Collect all fields that could contain file paths or patterns
    const readPath = input.file_path || input.path || "";
    const pattern = input.pattern || "";

    // Check file path and pattern for .env access (not command — too broad)
    const allFields = [readPath, pattern].join(" ");

    // Optional debug logging — non-fatal if it fails
    try {
      const debugFile = join(__dirname, "..", "hook-debug.log");
      appendFileSync(debugFile, `[${new Date().toISOString()}] Checking: ${allFields}\n`);
    } catch {}

    if (/\.env\b/.test(allFields)) {
      console.error("BLOCKED: Access to .env file is not allowed.");
      process.exit(2);
    }
  } catch (err) {
    // If the hook crashes unexpectedly, allow (don't block legitimate work)
    process.exit(0);
  }
}

main();
