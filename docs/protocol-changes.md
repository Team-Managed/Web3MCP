# Protocol change and release process

`protocol/SPEC.md` defines the wire format. The schema, validator, fixtures, SDK, and documentation implement or explain it. The current v0.1 profile is a candidate, with a v0.2 account-read PDA extension already represented in the schema; neither is frozen.

1. Propose a change in a GitHub issue. State the use case, rejected alternatives, compatibility impact, and security implications.
2. Update `protocol/SPEC.md` and the schema/validator together. Add valid and invalid conformance vectors and tests that run without the reference vault.
3. Exercise discovery and execution through the generic SDK. For a new binding, test a second independent program or fixture so vault-specific behavior cannot masquerade as protocol behavior.
4. Document whether existing configs and hosts can read the new version. A host must reject an unsupported version rather than guessing. Record the decision in `docs/adr/` when it changes a protocol boundary.
5. Merge through a reviewed PR. Publish the SDK only after its tests and package contents are verified. Keep deployment of reference programs separate from a protocol or SDK release.

A change to examples or prose does not change the wire format. A schema or account-layout change does, and needs an explicit version decision before publication.
