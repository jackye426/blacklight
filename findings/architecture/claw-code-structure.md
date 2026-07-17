# Claw Code Deep Architecture Study

**Kind:** inference
**Evidence:** `investigations/ultraworkers-claw-code/source-study.md`,
`investigations/ultraworkers-claw-code/architecture.md`,
`investigations/ultraworkers-claw-code/unknowns.md`, and the public repository metadata.

## Conclusion

`ultraworkers/claw-code` is a substantial, working-source agent harness, not merely a mock-up or a
directory of recovered names. Its concrete center is a provider-neutral model/tool loop with local
project context, policy-gated tools, persistent sessions, hooks, plugins, MCP, and background
sub-agents. Around that center is a much wider compatibility surface whose maturity varies from
fully executable to registry-backed to explicitly placeholder-only.

It should not be labelled as canonical or leaked Anthropic Claude Code source. The checked-out
repository calls itself a public Rust implementation, explicitly disclaims ownership of original
Claude Code source material, and disclaims Anthropic affiliation. The depth-one local clone also
cannot establish historical lineage. The defensible classification is a public, independently
maintained Claude Code-inspired harness artifact from the same ecosystem and period.

## Architectural character

The system is best understood as five rings:

1. The `claw` shell: CLI parsing, REPL, rendering, local diagnostics, and session commands.
2. The harness kernel: `ConversationRuntime`, provider and tool traits, hooks, permissions, usage,
   session updates, and compaction.
3. Capability adapters: providers, built-in tools, plugin tools, and runtime MCP tools.
4. Durable local context: instruction discovery, layered config, workspace-bound JSONL sessions,
   prompt cache, and agent manifests.
5. Coordination experiments: tasks, workers, teams, cron, LSP, lane events, recovery recipes, and
   RAG, with mixed levels of real integration.

The cleanest design choice is the narrow kernel boundary. Provider clients normalize Anthropic and
OpenAI-compatible streams into one event model, and all tool backends implement one text-in/text-out
executor contract. That makes the core loop easy to reason about and lets plugins and MCP join the
same permission and tool-definition path.

The weakest design choice is concentration. The roughly 20,000-line CLI file, 11,000-line tools
file, and 7,000-line command file combine parsing, policy, persistence, rendering, execution, and
compatibility behavior. The crate graph is modular, but these files remain internal monoliths.

## What is genuinely implemented

- Repeated model/tool turns, including multiple tool calls per assistant response.
- Anthropic and OpenAI-compatible streaming with reasoning and tool-call normalization.
- Layered system prompts from repository instructions, git state, config, and environment.
- Workspace-jailed file operations with traversal, symlink, binary, and size checks.
- Rule-based permissions, interactive escalation, and hook overrides.
- JSONL sessions with workspace binding, redaction, truncation, resume, fork, and compaction.
- Executable plugin lifecycle/hooks/tools and live stdio MCP discovery and calls.
- Background sub-agents with type-specific tool allowlists and persisted status artifacts.
- Strong machine-readable CLI output and a large contract-test surface.

## What is shallower than its name suggests

- LSP mostly models server state and cached diagnostics; other actions return dispatch placeholders.
- task, team, and cron tools manage in-memory records but do not by themselves provide a durable
  scheduler or distributed worker fleet.
- ACP/Zed is an explicit unsupported status surface.
- the primary `claw` binary does not consume the standalone RAG service; only `claw-analog` does.
- several worker boot health values and `TestingPermission` are explicit placeholders.

This distinction matters because the exposed tool catalog is not a reliable proxy for runtime
depth. Blacklight should classify tools by execution maturity, not simply by whether a schema and
dispatch arm exist.

## Security reading

The security model is layered rather than singular: a model-visible allowlist, an outer permission
policy, hooks, tool-specific path checks, and optional process isolation. That is a sound pattern.
File tools have the strongest defense in depth because they enforce canonical workspace boundaries
inside the operation as well as at policy classification time.

Shell safety is platform-dependent. Bash can use Linux namespace/network/filesystem isolation when
`unshare` is available. PowerShell has permission classification and timeouts but no equivalent OS
sandbox in this implementation. A report that says only "sandbox enabled" without platform and
capability details would overstate the guarantee.

Sub-agents run with a danger-full-access permission policy and no interactive prompter. Their
effective boundary is the fact that spawning `Agent` itself requires danger-full-access plus the
sub-agent type's tool allowlist. This is operationally reasonable for unattended delegation, but it
makes parent approval and allowlist correctness security-critical.

Plugins are another trust boundary. Enabled plugin lifecycle commands execute during runtime
construction, before the first model turn. Plugin enablement therefore means trusting code, not just
installing prompt metadata.

## Reliability reading

The strongest reliability mechanism is behavioral normalization: one event model across providers,
typed JSON output, deterministic mock-provider scenarios, explicit error kinds, session health
probes, and progressive context recovery. The repository shows sustained attention to automation
consumers rather than only terminal UX.

The main reliability risk is semantic drift between advertised and actual capability. The current
source has 11 crates, 115,842 Rust lines, and 55 built-in tool specs, while prominent documentation
still describes an older 9-crate, roughly 48,000-line, 40-tool checkpoint. Similar drift can occur
inside advanced tools whose schemas mature faster than their external integrations.

The 1,416 test attributes and zero ignored tests are encouraging source evidence, but not a green
build result. This study could not run Rust tests because Cargo is unavailable locally.

## Reusable lessons for Blacklight

- Model the agent loop as a small kernel with provider and tool traits.
- Treat project context assembly as a first-class, inspectable pipeline.
- Put permission requirements in tool metadata, then enforce sensitive invariants inside the tool
  operation as well.
- Normalize provider streams before orchestration sees them.
- Persist machine-readable session and sub-agent state so automation can recover after process loss.
- Record capability maturity separately from capability presence.
- Generate documentation counts from source instead of maintaining them by hand.
- Include platform-specific sandbox status in every safety claim.

## Blacklight implication

The generated 40-node, zero-edge architecture map remains an honest record of V1 analyzer coverage,
but it is no longer the best available understanding of this target. The manual study demonstrates
the exact value a Rust adapter should automate: crate dependencies, module imports, trait
implementations, call paths, tool specifications, permission requirements, and test associations.

Claw Code is therefore both a harness case study and a high-quality acceptance target for a future
Rust/tree-sitter analyzer. A successful adapter should reproduce the core call chain and maturity
distinctions above without relying on hand reading.
