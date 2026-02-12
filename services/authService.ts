import { supabase } from '../lib/supabaseClient';
import { dataService } from './dataService';

export const authService = {
    // Sign Up with Email and Password
    async signUp(email: string, password: string, fullName: string, dob: string, gender: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    dob: dob,
                    gender: gender,
                },
            },
        });

        if (data.user && !error) {
            // Create user profile
            const { error: profileError } = await dataService.createProfile(data.user.id, fullName);
            if (profileError) {
                console.error("Error creating user profile:", profileError);
            }
        }

        return { data, error };
    },

    // Verify OTP
    async verifyOtp(email: string, token: string) {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });
        return { data, error };
    },

    // Sign In with Email and Password
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    // Sign Out
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Get Current Session
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        return { session: data.session, error };
    },
};
