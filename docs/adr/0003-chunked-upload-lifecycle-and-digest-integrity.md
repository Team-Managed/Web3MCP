# Chunked Upload Lifecycle and Digest Integrity

Because Solana transactions have a 1,232-byte MTU while IDLs can reach 20–40 KiB, multi-transaction chunked uploads are required to publish on-chain configs. We established an on-chain lifecycle status (`0 = Uninitialized`, `1 = Uploading`, `2 = Published`) and an on-chain SHA-256 digest in the 81-byte header, requiring agent hosts to fail closed and reject reads unless the account is in the `Published` state with a matching digest.
