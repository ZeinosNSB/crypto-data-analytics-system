# Data Contract

This folder defines the shared payload contract across ingestion, streaming, batch, and backend modules.

## Files

- `contract.v1.json`: JSON Schema used as the source of truth.
- `example.market-event.v1.json`: valid sample payload for quick reference.

## Team Agreement

- New producers must emit payloads compatible with `schema_version = 1`.
- Consumers must parse and validate fields based on `contract.v1.json`.
- Contract changes require:
  1. New PR updating this folder.
  2. Changelog note in PR description.
  3. Consumer module owners confirm compatibility before merge.

## Notes

- `price` and `quantity` are strings to avoid floating-point precision loss.
- Event timestamps are epoch milliseconds.
