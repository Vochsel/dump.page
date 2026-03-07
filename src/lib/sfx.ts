"use client";

import { sfxr } from "jsfxr";

// Pre-designed sounds encoded as b58 strings (consistent on every play)
// Soft noise pop for adding/pasting items
const SFX_ADD = "7BMHBGNtjdtgWGXCMN4i7JaX3BHp3AXeMyQVG7P72Ko1FvxE4HvsfMhQdQXch4sBwimWn7ntqSCjYb3zs6ZML1Uy4oLMGGfuUt9R4BiEvLjHGUUTnkw84jsuH";
// Crunchy vibrato hit for deleting
const SFX_DELETE = "7BMHBGMFGFPSrkLSKnvTKUcmJDtSuHxMn4uHQ94E7WcR6WmC3cr7i5RF2ybhRRKFQAQDEpCwBXACt6GSjR6vySegEWX5mhFBWyrFeij7dxYnBSSUiCwocjuUK";
// Short noise click for drag pick-up
const SFX_CLICK = "7BMHBGN5brzd84wS453Cdjmbv3yFSPEwDs8GQPZyTsiBgWX7DpApHTjYpH6ZuNZJVTx83AQCNTdrk2Dvc1xdZp3ZfaJnvBCRHXRUvqjPt42b2HRgNAQSosZ59";
// Square wave drop for drag release
const SFX_RELEASE = "34T6Pm2Dj6RmsERf2UZbVLmi8PP5r9qEwsxkESwp4cLpPRx57qHSsuivhKBZiWWxkdT5kVCZch5WcRMhKPxc6tBVttZ4rAG9p5NqAWtdsAbKNV1d4E8N6sECo";

let muted = false;

function decode(encoded: string, volume = 0.25): Record<string, unknown> {
  const sound = sfxr.b58decode(encoded) as Record<string, unknown>;
  // b58decode strips these required fields — add them back
  sound.oldParams = true;
  sound.sound_vol = volume;
  sound.sample_rate = 44100;
  sound.sample_size = 8;
  return sound;
}

// Pre-decode all sounds once so playback is instant
let sounds: Record<string, Record<string, unknown>> | null = null;

function getSounds() {
  if (!sounds) {
    sounds = {
      add: decode(SFX_ADD, 0.03),
      delete: decode(SFX_DELETE, 0.015),
      click: decode(SFX_CLICK, 0.08),
      release: decode(SFX_RELEASE, 0.04),
    };
  }
  return sounds;
}

function play(name: string) {
  if (muted) return;
  try {
    const s = getSounds()[name];
    if (s) sfxr.play(s);
  } catch {
    // Audio not available
  }
}

export const sfx = {
  add: () => play("add"),
  delete: () => play("delete"),
  dragStart: () => play("click"),
  dragEnd: () => play("release"),
  mute: () => { muted = true; },
  unmute: () => { muted = false; },
  isMuted: () => muted,
};
