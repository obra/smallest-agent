// ABOUTME: Ultra-minimal AI agent that connects Claude to bash commands
// ABOUTME: Provides interactive CLI for AI-assisted coding (exit with Ctrl+C)

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import { createInterface } from "readline";

// Initialize client (reads ANTHROPIC_API_KEY automatically), conversation state, and helpers
const client = new Anthropic();
const messages = [];
const log = console.log;
const push = (role, content) => messages.push({ role, content });
const rl = createInterface({ input: process.stdin, output: process.stdout });

// Main loop: show prompt, get user input, process with Claude
for (let line; line = await new Promise(r => rl.question("> ", r));) {
  push("user", line);

  // Inner loop: agentic loop until Claude responds without a tool call
  for (;;) {
    let { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      tools: [{
        name: "bash",
        description: "sh",
        input_schema: { type: "object", properties: { cmd: {} } }, // cmd accepts any value
      }],
    });

    // "tool_use" > "text" alphabetically, so this finds tool_use blocks
    const tool = content.find(b => b.type > "text");
    push("assistant", content);

    if (!tool) {
      // "text" < "tool" alphabetically, so this finds text blocks
      log(content.find(b => b.type < "tool")?.text);
      break;
    }

    // Execute the bash command Claude requested
    log(tool.input.cmd);
    let output;
    try { output = execSync(tool.input.cmd) + ""; }
    catch (e) { output = e.message; }

    log(output);
    push("user", [{ type: "tool_result", tool_use_id: tool.id, content: output }]);
  }
}
