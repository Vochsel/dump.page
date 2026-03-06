declare module "jsfxr" {
  interface Sfxr {
    generate(preset: string): unknown;
    play(sound: unknown): void;
    toAudio(sound: unknown): HTMLAudioElement;
    toWave(sound: unknown): { dataURI: string };
    b58encode(sound: unknown): string;
    b58decode(encoded: string): unknown;
  }
  export const sfxr: Sfxr;
}
