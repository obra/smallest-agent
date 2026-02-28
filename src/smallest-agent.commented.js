// ABOUTME: Readable source that minifies to src/smallest-agent.js byte-for-byte.

import e from "@anthropic-ai/sdk";
import { execSync as t } from "child_process";

let i = new e,
  n = [],
  // Push helper keeps every turn in Anthropic's messages array format.
  c = (e, t) => n.push({ role: e, content: t }),
  r;

// Each stdin chunk is one user turn (multi-line paste remains one turn).
for await (r of process.stdin) {
  // Keep calling Claude until the turn ends with plain text (no tool request).
  for (c("user", r + ""); ; ) {
    let { content: e } = await i.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 4e3,
        messages: n,
        // Minimal schema the API accepts while still guiding tool args to { c }.
        tools: [{ name: "sh", input_schema: { type: "object", properties: { c: {} } } }],
      }),
      // Claude places the actionable block last: either tool_use or final text.
      u = e.at(-1);

    if (c("assistant", e), !u.id) {
      // End of turn: print assistant text and emit next prompt marker.
      process.stdout.write(u.text + "\n> ");
      break;
    }

    // ';:' forces a zero exit status so execSync never throws on bad commands.
    c("user", [{ type: "tool_result", tool_use_id: u.id, content: t(u.input.c + ";:") + "" }]);
  }
}
