import { execSync } from "node:child_process";

// apphosting.yaml's env block only supports a literal `value` string or a
// Secret Manager `secret` reference (confirmed against Firebase's own
// App Hosting docs) — there's no way for it to carry a value that changes
// with every commit, so it can't be the mechanism for a live build SHA.
// This reads the actual commit being built directly via git instead, which
// runs correctly inside Firebase App Hosting's build container since it
// clones the full repo (including .git) before running `next build`.
// Empty string (not a fallback like "unknown") when git isn't available —
// the Sandbox page's version indicator treats an empty/missing value as
// "local dev, show nothing or 'dev'" per its own spec.
function readCommitSha() {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // voyageai (lib/memory-embeddings.ts) has an optional local-tokenizer
  // feature that dynamically imports @huggingface/transformers — we never
  // call it (only the remote .embed() API), but bundlers that fully
  // resolve the whole dependency graph choke trying to statically resolve
  // it (confirmed the hard way against the Cloud Functions esbuild build,
  // which needed the equivalent --external flag). Excluding it from
  // server bundling here too, preemptively, for the same reason.
  serverExternalPackages: ["@huggingface/transformers"],
  env: {
    NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA || readCommitSha(),
  },
};

export default nextConfig;
