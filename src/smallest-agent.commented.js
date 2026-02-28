// ABOUTME: Ultra-minimal AI agent that connects Claude to bash commands
// ABOUTME: Provides interactive CLI for AI-assisted coding (exit with Ctrl+C)

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY automatically
const messages = [];
const push = (role, content) => messages.push({ role, content });

let turnInput;
const stdout = process.stdout;

stdout.write("> ");

// Each stdin chunk is one user turn (multi-line paste stays a single turn)
for await (turnInput of process.stdin) {
  push("user", turnInput + "");

  // Agent loop continues until Claude responds without a tool call
  for (;;) {
    let { content } = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      messages,
      // names are short here because this file is the source for minification
      tools: [{ name: "sh", input_schema: { type: "object", properties: { c: {} } } }],
    });

    const { input: toolInput, id: toolUseId } = content.at(-1);
    push("assistant", content);

    if (!toolInput) {
      stdout.write(content[0].text + "\n> ");
      break;
    }

    // Route stderr into stdout; ':" prevents non-zero status from throwing
    turnInput = execSync(toolInput.c + " 2>&1;:") + "";
    stdout.write(toolInput.c + "\n" + turnInput + "\n");
    push("user", [{ type: "tool_result", tool_use_id: toolUseId, content: turnInput }]);
  }
}
