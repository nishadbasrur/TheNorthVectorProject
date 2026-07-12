// openwakeword-wasm-browser ships no types (plain JS package) — declared
// here from its actual source (node_modules/openwakeword-wasm-browser/src/WakeWordEngine.js)
// rather than guessed, covering only the surface app/sandbox/use-wake-word.ts
// actually uses.
declare module "openwakeword-wasm-browser" {
  export type WakeWordDetectEvent = { keyword: string; score: number; at: number };

  export type WakeWordEngineOptions = {
    keywords?: string[];
    modelFiles?: Record<string, string>;
    baseAssetUrl?: string;
    ortWasmPath?: string;
    frameSize?: number;
    sampleRate?: number;
    vadHangoverFrames?: number;
    detectionThreshold?: number;
    cooldownMs?: number;
    executionProviders?: string[];
    embeddingWindowSize?: number;
    debug?: boolean;
  };

  export const MODEL_FILE_MAP: Record<string, string>;

  export class WakeWordEngine {
    constructor(options?: WakeWordEngineOptions);
    on(event: "ready", handler: () => void): () => void;
    on(event: "detect", handler: (payload: WakeWordDetectEvent) => void): () => void;
    on(event: "speech-start" | "speech-end", handler: () => void): () => void;
    on(event: "error", handler: (error: Error) => void): () => void;
    off(event: string, handler: (...args: never[]) => void): void;
    load(): Promise<void>;
    start(options?: { deviceId?: string; gain?: number }): Promise<void>;
    stop(): Promise<void>;
    setGain(value: number): void;
    setActiveKeywords(keywords: string[]): void;
  }

  export default WakeWordEngine;
}
