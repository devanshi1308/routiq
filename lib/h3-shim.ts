// h3-js asks the runtime for TextDecoder("utf-16le"). Hermes (React Native) has a TextDecoder that rejects that
// encoding, which crashes the app at startup with "Unknown encoding: utf-16le". lib/h3.ts imports this file first, before h3-js. It installs a
// tolerant TextDecoder first, then re-exports h3-js. Import H3 from here, never from "h3-js" directly.
const g = globalThis as any;
const Native = g.TextDecoder;

if (Native) {
  let supported = true;
  try {
    new Native("utf-16le");
  } catch {
    supported = false;
  }
  if (!supported) {
    const Patched = class PatchedTextDecoder {
      private inner: any = null;
      constructor(label = "utf-8", options?: unknown) {
        if (!/^utf-?16(le)?$/i.test(label)) this.inner = new Native(label, options);
      }
      decode(input?: ArrayBufferView | ArrayBuffer, options?: unknown): string {
        if (this.inner) return this.inner.decode(input, options);
        if (!input) return "";
        const view = ArrayBuffer.isView(input) ? input : new Uint8Array(input);
        const units = new Uint16Array(view.buffer.slice(view.byteOffset, view.byteOffset + (view.byteLength & ~1)));
        let out = "";
        for (let i = 0; i < units.length; i += 4096) out += String.fromCharCode(...units.subarray(i, i + 4096));
        return out;
      }
    };
    // defineProperty also works when the runtime exposes TextDecoder as a getter-only property
    Object.defineProperty(globalThis, "TextDecoder", { value: Patched, writable: true, configurable: true });
  }
}

