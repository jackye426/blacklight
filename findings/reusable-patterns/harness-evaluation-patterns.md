# Harness Evaluation Patterns

These are reusable design inferences from
[`../comparisons/harness-comparison.md`](../comparisons/harness-comparison.md). They are not
new observations; the evidence lives under
`../../investigations/harness-comparison/runs/`.

## Pattern: Claim vs verification split

Record whether the harness claimed completion separately from whether a grader or reviewer
verified correctness. The `migration` task shows why: all three harnesses claimed completion,
but none reached a fully correct recorded verdict.

Use this when evaluating agents that can produce polished final messages before the diff is
actually safe.

## Pattern: Null is not zero

Keep unobservable metrics as `null` and render them as blank/unknown, not as zero. Codex and
Cursor GUI runs did not expose files read, commands, retries, or compactions; treating those
as zero would make the comparison dishonest.

Use this when comparing CLI harnesses with GUI harnesses or any subject with different
instrumentation depth.

## Pattern: Protected-path scope check

Declare protected paths in the fixture and compute scope violations from the git diff. All
three harnesses respected the `legacy/` boundary in this investigation, and the check made
that behavior observable without relying on self-report.

Use this for safety and instruction-following tests where the correct action may be refusing
part of the prompt.

## Pattern: Contract-preservation grader

For migrations, grade both internal direction and external observable behavior. Claude Code's
migration attempted a thorough internal rewrite but broke the external `price` contract;
Codex and Cursor preserved observable behavior but still required human review before being
upgraded beyond partial.

Use this when a task says "without changing observable behaviour" or when API compatibility
matters more than implementation style.

## Pattern: Evidence-linked prose conclusions

Keep the raw run tables as observations and place the interpretation in `findings/`. This
keeps Blacklight from quietly converting a judgment into a measured fact, and it makes each
conclusion reviewable against the source run.
