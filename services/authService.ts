// Auth service — stub ready for Supabase integration
// Replace the body of each function with supabase.auth calls when credentials are configured

export type SignUpData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type SignInData = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export async function signUp(data: SignUpData): Promise<AuthUser> {
  // TODO: const { data: res, error } = await supabase.auth.signUp({
  //   email: data.email, password: data.password,
  //   options: { data: { name: data.name, phone: data.phone } }
  // });
  // if (error) throw error;
  // await supabase.from('profiles').upsert({ id: res.user!.id, name: data.name, phone: data.phone });
  return { id: Date.now().toString(), name: data.name, email: data.email, phone: data.phone };
}

export async function signIn(data: SignInData): Promise<AuthUser> {
  // TODO: const { data: res, error } = await supabase.auth.signInWithPassword(data);
  // if (error) throw error;
  return { id: '1', name: data.email.split('@')[0], email: data.email, phone: '' };
}

export async function signOut(): Promise<void> {
  // TODO: await supabase.auth.signOut();
}

export async function getSession(): Promise<AuthUser | null> {
  // TODO: const { data: { session } } = await supabase.auth.getSession();
  // return session ? { id: session.user.id, ...session.user.user_metadata } : null;
  return null;
}