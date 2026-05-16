// Runtime premium state — written by usePremium AFTER the server fetch.
// Source of truth is the server (user_subscriptions table via RLS).
// This is NOT persisted, and NOT readable from localStorage, so casual
// tampering ("set uf_audio_fx_allowed = 1") cannot flip it.

let _isPremium = false;

export const setRuntimePremium = (value: boolean) => {
  _isPremium = !!value;
};

export const getRuntimePremium = (): boolean => _isPremium;
