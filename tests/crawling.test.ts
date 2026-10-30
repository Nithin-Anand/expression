import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// This file uses only whole-site allow/disallow groups, not wildcard path patterns.
function rulesByAgent() {
  const rules = new Map<string, string[]>();
  for (const group of readFileSync("public/robots.txt", "utf8").split(/\r?\n\s*\r?\n/)) {
    const agents = [...group.matchAll(/^User-agent:\s*(.+)$/gim)].map((match) =>
      match[1]!.trim().toLowerCase(),
    );
    const directives = [...group.matchAll(/^(Allow|Disallow):\s*(.+)$/gim)].map(
      (match) => `${match[1]!.toLowerCase()}:${match[2]!.trim()}`,
    );
    for (const agent of agents) rules.set(agent, [...(rules.get(agent) ?? []), ...directives]);
  }
  return rules;
}

test("AI training, search and fetch agents receive explicit whole-site disallow directives", () => {
  const rules = rulesByAgent();
  for (const agent of [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-SearchBot",
    "Claude-User",
    "PerplexityBot",
    "Perplexity-User",
    "meta-externalagent",
    "meta-externalfetcher",
    "Google-Extended",
    "CCBot",
    "DuckAssistBot",
    "MistralAI-User",
  ]) {
    assert.ok(rules.get(agent.toLowerCase())?.includes("disallow:/"), agent);
    assert.ok(!rules.get(agent.toLowerCase())?.includes("allow:/"), agent);
  }
});

test("ordinary search indexing stays allowed", () => {
  const rules = rulesByAgent();
  for (const agent of ["Googlebot", "Bingbot", "DuckDuckBot", "Slurp", "*"]) {
    assert.ok(rules.get(agent.toLowerCase())?.includes("allow:/"), agent);
    assert.ok(!rules.get(agent.toLowerCase())?.includes("disallow:/"), agent);
  }
});
