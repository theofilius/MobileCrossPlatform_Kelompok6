// Media service — uploads photo/audio to Supabase Storage so other users
// (petugas / admin) can fetch them. Reads the local file via fetch() so the
// expo-image-picker / expo-av URIs (file://...) work in React Native.

import { supabase } from './supabase';

export type MediaKind = 'photo' | 'audio';

const BUCKETS: Record<MediaKind, string> = {
  photo: 'report-photos',
  audio: 'report-audio',
};

const EXT: Record<MediaKind, string> = {
  photo: 'jpg',
  audio: 'm4a',
};

const CONTENT_TYPE: Record<MediaKind, string> = {
  photo: 'image/jpeg',
  audio: 'audio/m4a',
};

/**
 * Upload a local file:// URI to Supabase Storage and return its public URL.
 * Path is `<userId>/<timestamp>-<rand>.<ext>` — matches the RLS policy
 * that scopes uploads to (storage.foldername(name))[1] = auth.uid()::text.
 *
 * Note: we use `arrayBuffer()` instead of `blob()` because on React Native
 * (especially iOS) the Blob returned from `fetch(file://...)` often reports
 * size 0 and Supabase ends up uploading an empty file. ArrayBuffer is reliable.
 */
export async function uploadToStorage(
  uri: string,
  kind: MediaKind,
  userId: string,
): Promise<string> {
  const res = await fetch(uri);
  const arrayBuffer = await res.arrayBuffer();

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error('File kosong atau tidak terbaca.');
  }

  const path = `${userId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${EXT[kind]}`;
  const { error } = await supabase.storage
    .from(BUCKETS[kind])
    .upload(path, arrayBuffer, {
      contentType: CONTENT_TYPE[kind],
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKETS[kind]).getPublicUrl(path);
  return data.publicUrl;
}
