# Release Notes

## 2.0.0 - 2026-04-26

CLP-2.0 schema upgrade for faithfulness-aware reasoning accountability.

- Added typed reasoning steps with explicit input types, output types, operation types, rule schemas, dependencies, evidence references, and runtime typecheck metadata.
- Added record-level `FaithfulnessCertification` metadata with `structural_check`, `external_verifier`, `consensus`, and `unverified` methods.
- Added `schema_version` and `hash_version` entry markers.
- Added canonical v2 entry hashing over the full integrity-bearing entry payload, including reasoning steps and faithfulness certification.
- Preserved CLP-1.x verification through dual-mode hash verification.
- Added migration helpers for verifying v1 chains and re-hashing them as v2 chains.
- Added faithfulness summary metrics to generated reasoning profiles and markdown export.
- Updated README framing to separate outcome accuracy, behavioral patterns, and faithfulness evidence, with PC-CoT arXiv:2510.01069 cited as design inspiration.

## 1.0.1 - 2026-04-26

Release hygiene pass for CLP-1.0.

- Rebuilt distributable files from TypeScript source.
- Verified dependency installation, audit, tests, and build locally.
- Normalised package metadata for npm/GitHub citation.
- Added MIT license file when missing.
- Recorded local folder name: cognitive-ledger.
- Recorded GitHub repository: repowazdogz-droid/cognitive-ledger.

No protocol schema or runtime semantics were intentionally changed.
