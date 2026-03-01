import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'candidate' | 'recruiter';

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: UserRole;
    skills: string[];
    resume_url: string | null;
    resume_text: string;
    profile_completeness: number;
    company_name: string | null;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<{ error: string | null }>;
    signInWithGoogle: () => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildLocalProfile(authUser: User): Profile {
    const meta = authUser.user_metadata || {};
    return {
        id: authUser.id,
        full_name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        role: (meta.role as UserRole) || 'candidate',
        avatar_url: meta.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
        skills: [],
        resume_url: null,
        resume_text: '',
        profile_completeness: 10,
        company_name: null,
        created_at: new Date().toISOString(),
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const profileFetchId = useRef(0); // track latest fetch to prevent stale updates

    // Step 1: Listen for auth state — ONLY update user/session, NO DB calls here
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, s) => {
                setSession(s);
                setUser(s?.user ?? null);
                if (!s?.user) {
                    setProfile(null);
                    setIsLoading(false);
                }
            }
        );

        // Fallback timeout
        const timeout = setTimeout(() => setIsLoading(false), 3000);

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    // Step 2: When user changes, fetch/create profile in a SEPARATE effect (outside auth lock)
    useEffect(() => {
        if (!user) return;

        const currentFetchId = ++profileFetchId.current;

        const loadProfile = async () => {
            try {
                // Try to fetch existing profile
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                // Ignore if a newer fetch has started
                if (currentFetchId !== profileFetchId.current) return;

                if (data) {
                    setProfile(data as Profile);
                    setIsLoading(false);
                    return;
                }

                if (error) {
                    console.warn('Profile fetch warn:', error.message);
                }

                // No profile exists — create one
                const localProfile = buildLocalProfile(user);
                // Set local profile immediately so UI doesn't block
                setProfile(localProfile);
                setIsLoading(false);

                // Then try to persist it
                const { data: created, error: insertErr } = await supabase
                    .from('profiles')
                    .upsert({
                        id: localProfile.id,
                        full_name: localProfile.full_name,
                        email: localProfile.email,
                        role: localProfile.role,
                        avatar_url: localProfile.avatar_url,
                        skills: localProfile.skills,
                        resume_url: localProfile.resume_url,
                        resume_text: localProfile.resume_text,
                        profile_completeness: localProfile.profile_completeness,
                        company_name: localProfile.company_name,
                    }, { onConflict: 'id' })
                    .select()
                    .single();

                if (currentFetchId !== profileFetchId.current) return;

                if (created) {
                    setProfile(created as Profile);
                } else if (insertErr) {
                    console.warn('Profile upsert warn:', insertErr.message);
                    // Keep local profile — app still works
                }
            } catch (e: any) {
                if (currentFetchId !== profileFetchId.current) return;
                console.warn('Profile load error:', e.message);
                // Fallback: use local profile so app works
                setProfile(buildLocalProfile(user));
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [user?.id]);

    const refreshProfile = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
        if (data) setProfile(data as Profile);
    }, [user]);

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return { error: error?.message ?? null };
        } catch (e: any) {
            return { error: e.message || 'Sign in failed' };
        }
    };

    const signUp = async (email: string, password: string, role: UserRole, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName, role } },
            });
            if (error) return { error: error.message };
            if (data.user?.identities?.length === 0) {
                return { error: 'An account with this email already exists. Please sign in instead.' };
            }
            return { error: null };
        } catch (e: any) {
            return { error: e.message || 'Sign up failed' };
        }
    };

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/dashboard` },
            });
            return { error: error?.message ?? null };
        } catch (e: any) {
            return { error: e.message || 'Google sign in failed' };
        }
    };

    const handleSignOut = async () => {
        profileFetchId.current++; // cancel any in-flight profile loads
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, isLoading, signIn, signUp, signInWithGoogle, signOut: handleSignOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
