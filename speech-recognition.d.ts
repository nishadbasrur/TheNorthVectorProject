// TypeScript's bundled lib.dom.d.ts already declares SpeechRecognitionEvent,
// SpeechRecognitionErrorEvent, SpeechRecognitionResult(List), and
// SpeechRecognitionAlternative — but not SpeechRecognition itself, since the
// API is still non-standard (Chrome/Safari ship it as webkitSpeechRecognition).
// A third-party @types package was tried here first and pulled in a
// conflicting, incompatible SpeechRecognitionEvent shape; this fills only the
// actual gap instead, reusing TypeScript's own existing types.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}
