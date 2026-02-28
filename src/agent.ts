#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";

const client = new Anthropic();
const messages: Anthropic.MessageParam[] = [];
const push = (role: Anthropic.MessageParam["role"], content: Anthropic.MessageParam["content"]) =>
  messages.push({ role, content });

for await (const turn of process.stdin) {
  push("user", turn + "");

  for (;;) {
    const { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      tools: [{ name: "sh", input_schema: { type: "object" as const, properties: { c: {} } } }],
    });

    const last = content.at(-1);
    if (!last) {
      process.stdout.write("\n> ");
      break;
    }

    push("assistant", content);
    if (last.type !== "tool_use") {
      process.stdout.write((last.type === "text" ? last.text : "") + "\n> ");
      break;
    }

    const cmd = (last.input as { c?: string }).c ?? "";
    const output = execSync(cmd + ";:") + "";
    push("user", [{ type: "tool_result", tool_use_id: last.id, content: output }]);
  }
}
