# NV-H001: Build Hardening

## Status

Started.

## Purpose

This hardening pass establishes the first automated check loop for North Vector V1.

## Changes

- Added `test` script using Vitest.
- Added `check` script combining typecheck, lint, test, and build.
- Added Vitest configuration.
- Added GitHub Actions CI workflow.

## Local Command

Run:

```text
npm install
npm run check
```

## Expected Outcome

The first CI/local run may expose TypeScript, lint, dependency, or build errors.

Those errors should become the next repair tickets.

## Next Step

Run the check locally or through GitHub Actions, then fix the first real failure.