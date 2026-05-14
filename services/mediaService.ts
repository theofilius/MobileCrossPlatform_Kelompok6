// Media service — local URI passthrough, ready for Supabase Storage

export type MediaType = 'photo' | 'audio';

export async function uploadMedia(uri: string, type: MediaType, reportId: string): Promise<string> {
  // TODO: Upload to Supabase Storage
  // const ext = type === 'photo' ? 'jpg' : 'm4a';
  // const path = `${reportId}/${Date.now()}.${ext}`;
  // const { data, error } = await supabase.storage.from('media').upload(path, { uri }, { contentType: type === 'photo' ? 'image/jpeg' : 'audio/m4a' });
  // if (error) throw error;
  // return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  return uri;
}

export function getMediaUrl(path: string): string {
  // TODO: return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  return path;
}