// Simple singleton to pass audio URI back from audio-recording modal to report-form.
// Expo Router doesn't support returning data via router.back(), so we use this bridge.

let pendingUri: string | null = null;

export function setPendingAudio(uri: string): void {
  pendingUri = uri;
}

export function getPendingAudio(): string | null {
  return pendingUri;
}

export function clearPendingAudio(): void {
  pendingUri = null;
}