import { computed, Injectable, signal } from '@angular/core';
import { AuthError, createClient, Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    __MEETMIDWAY_CONFIG__?: {
      supabaseUrl?: string;
      supabasePublishableKey?: string;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = window.__MEETMIDWAY_CONFIG__ ?? {};
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

  constructor() {
    this.client?.auth.getSession().then(({ data }) => this.session.set(data.session));
    this.client?.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  async signUp(email: string, password: string, fullName: string): Promise<{ confirmationRequired: boolean }> {
    const client = this.requireClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { 
        data: { full_name: fullName }, 
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    
    // If we have a session immediately, email confirmation is disabled
    const confirmationRequired = !data.session;
    
    // If session exists, update our signal
    if (data.session) {
      this.session.set(data.session);
    }
    
    return { confirmationRequired };
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

  async continueWithGoogle(): Promise<void> {
    const client = this.requireClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
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

  private requireClient(): SupabaseClient {
    if (!this.client) {
      throw new AuthError('Supabase is not configured yet. Add the project URL and publishable key to runtime configuration.');
    }
    return this.client;
  }
}
