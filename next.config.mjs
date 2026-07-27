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
};

export default nextConfig;
