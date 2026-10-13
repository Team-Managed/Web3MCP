# Restrict v0.1 Tool Input Types to Three Scalars

We restricted tool parameters in `inputSchema.properties` strictly to `u64` (decimal integer string), `boolean`, and `publicKey` (Base58 string), rejecting freeform strings, floats, arrays, and nested objects. This constrains the attack surface for prompt injection, avoids ambiguous serialization across languages, and guarantees deterministic Borsh instruction encoding for the initial protocol release.
