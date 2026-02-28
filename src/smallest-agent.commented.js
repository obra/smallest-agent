// ABOUTME: Readable equivalent of the ultra-small Claude shell agent.
// ABOUTME: Keeps the same turn loop and tool behavior as smallest-agent.js.

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";

const client = new Anthropic();
const messages = [];
const push = (role, content) => messages.push({ role, content });

// Each stdin chunk is one user turn.
for await (const turn of process.stdin) {
  push("user", turn + "");

  for (;;) {
    const { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      tools: [{ name: "sh", input_schema: { type: "object", properties: { c: {} } } }],
    });

    const last = content.at(-1);
    push("assistant", content);

    if (!last.id) {
      process.stdout.write(last.text + "\n> ");
      break;
    }

    const output = execSync(last.input.c + ";:") + "";
    push("user", [{ type: "tool_result", tool_use_id: last.id, content: output }]);
  }
}
