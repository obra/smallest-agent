// ABOUTME: Ultra-minimal AI agent that connects Claude to bash commands
// ABOUTME: Provides interactive CLI for AI-assisted coding (exit with Ctrl+C)

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY automatically
const messages = [];
const push = (role, content) => messages.push({ role, content });

let output;
let inputChunk;

process.stdout.write("> ");

// Each stdin chunk is one user turn (multi-line paste stays a single turn)
for await (inputChunk of process.stdin) {
  push("user", inputChunk + "");

  // Agent loop continues until Claude responds without a tool call
  for (;;) {
    const { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      // names are short here because this file is the source for minification
      tools: [{ name: "s", input_schema: { type: "object", properties: { c: {} } } }],
    });

    const tool = content.at(-1);
    push("assistant", content);

    if (!tool.input) {
      console.log(content[0].text);
      process.stdout.write("\n> ");
      break;
    }

    // Route stderr into stdout; ':" prevents non-zero status from throwing
    console.log(tool.input.c + "\n" + (output = execSync(tool.input.c + " 2>&1;:") + ""));
    push("user", [{ type: "tool_result", tool_use_id: tool.id, content: output }]);
  }
}
