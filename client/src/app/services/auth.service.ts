import { computed, Injectable, signal } from '@angular/core';
import { AuthError, createClient, Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __MEETMIDWAY_CONFIG__?: {
      supabaseUrl?: string;
      supabasePublishableKey?: string;
      clientUrl?: string;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = window.__MEETMIDWAY_CONFIG__ ?? {};
  private readonly clientUrl = this.config.clientUrl || window.location.origin;
  private readonly client: SupabaseClient | null = this.config.supabaseUrl && this.config.supabasePublishableKey
    ? createClient(this.config.supabaseUrl, this.config.supabasePublishableKey, {
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce',
          autoRefreshToken: true,
        }
      })
    : null;

  readonly session = signal<Session | null>(null);
  readonly configured = !!this.client;
  readonly displayName = computed(() => {
    const user = this.session()?.user;
    const metadata = user?.user_metadata ?? {};
    const name = metadata['full_name'] ?? metadata['name'];
    return typeof name === 'string' && name.trim()
      ? name.trim()
      : user?.email?.split('@')[0] || 'there';
  });

  async hasSession(): Promise<boolean> {
    if (this.session()) return true;
    const result = this.client ? await this.client.auth.getSession() : { data: { session: null } };
    this.session.set(result.data.session);
    return !!result.data.session;
  }

  async completeAuthCallback(callbackUrl = window.location.href): Promise<{ session: Session | null; email: string | null }> {
    const client = this.requireClient();
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');

    const existingSession = await client.auth.getSession();
    if (existingSession.data.session) {
      this.session.set(existingSession.data.session);
      return { session: existingSession.data.session, email: existingSession.data.session.user.email ?? null };
    }

    if (code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw error;
      this.session.set(data.session);
      return { session: data.session, email: data.session?.user.email ?? null };
    }

    const session = await client.auth.getSession();
    this.session.set(session.data.session);
    return { session: session.data.session, email: session.data.session?.user.email ?? null };
  }

  constructor() {
    this.client?.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.client?.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  async signUp(email: string, password: string, fullName: string, nextPath?: string): Promise<{ confirmationRequired: boolean; isNewUser: boolean }> {
    const client = this.requireClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { 
        data: { full_name: fullName }, 
        emailRedirectTo: this.buildCallbackUrl(nextPath)
      }
    });
    if (error) throw error;
    
    // If we have a session immediately, email confirmation is disabled.
    const confirmationRequired = !data.session;
    const isNewUser = !!data.session && !!data.user;
    
    // If session exists, update our signal
    if (data.session) {
      this.session.set(data.session);
    }
    
    return { confirmationRequired, isNewUser };
  }

  async signIn(email: string, password: string): Promise<void> {
    const client = this.requireClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Update session signal
    if (data.session) {
      this.session.set(data.session);
    }
  }

  async continueWithGoogle(nextPath?: string): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: this.buildCallbackUrl(nextPath),
        skipBrowserRedirect: false
      }
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    this.session.set(null);
  }

  async getAccessToken(): Promise<string | null> {
    const currentSession = this.session();
    if (currentSession?.access_token) {
      return currentSession.access_token;
    }

    const client = this.requireClient();
    const { data } = await client.auth.getSession();
    if (data.session) {
      this.session.set(data.session);
    }
    return data.session?.access_token ?? null;
  }

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new AuthError('Supabase is not configured yet. Add the project URL and publishable key to runtime configuration.');
    }
    return this.client;
  }

  private buildCallbackUrl(nextPath?: string): string {
    const url = new URL('/auth/callback', this.clientUrl);
    if (nextPath) {
      url.searchParams.set('next', nextPath);
    }
    return url.toString();
  }
}
