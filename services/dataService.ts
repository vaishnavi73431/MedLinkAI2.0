import { supabase } from '../lib/supabaseClient';
import { UserProfile, FurnitureItem } from '../types';

export const dataService = {
    // Create a new profile (usually called after signup)
    async createProfile(userId: string, fullName: string) {
        const defaultProfile: Partial<UserProfile> = {
            id: userId,
            full_name: fullName,
            level: 1,
            score: 0,
            max_score_for_level: 100,
            unlocked_zones: ['home'],
            inventory: [],
            placed_items: [],
            removed_trees: [],
        };

        const { data, error } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single();

        if (error) {
            console.error('Error creating profile:', error);
            // If error is duplicate key, try to fetch instead (in case it was already created)
            if (error.code === '23505') {
                return this.getProfile(userId);
            }
            return { data: null, error };
        }

        return { data, error: null };
    },

    // Get user profile
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return { data: null, error };
        }

        return { data: data as UserProfile, error: null };
    },

    // Update specific fields in the profile
    async updateProfile(userId: string, updates: Partial<UserProfile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return { data: null, error };
        }

        return { data: data as UserProfile, error: null };
    },

    // Sync the entire game state (useful for auto-save)
    async syncGameState(userId: string, state: {
        level: number;
        score: number;
        maxScoreForLevel: number;
        inventory: FurnitureItem[];
        placedItems: any[];
        unlockedZones: string[];
        removedTrees: number[];
    }) {
        return this.updateProfile(userId, {
            level: state.level,
            score: state.score,
            max_score_for_level: state.maxScoreForLevel,
            inventory: state.inventory,
            placed_items: state.placedItems,
            unlocked_zones: state.unlockedZones,
            removed_trees: state.removedTrees,
        });
    },

    // Save a chat message
    async saveChatMessage(userId: string, botId: string, message: { sender: string, text: string, timestamp: number }) {
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: userId,
                bot_id: botId,
                sender: message.sender,
                text: message.text,
                timestamp: message.timestamp
            });

        if (error) {
            console.error('Error saving chat message:', error);
            return { error };
        }
        console.log("Chat message saved successfully:", message.text.substring(0, 20) + "...");
        return { error: null };
    },

    // Get chat history for a bot
    async getChatHistory(userId: string, botId: string) {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('user_id', userId)
            .eq('bot_id', botId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching chat history:', error);
            return { data: [], error };
        }

        return { data, error: null };
    },

    // --- SOCIAL SPHERE ---

    // Get all posts with likes and comments
    async getSocialFeed() {
        const { data, error } = await supabase
            .from('social_posts')
            .select(`
                *,
                social_likes (user_id),
                social_comments (
                    id,
                    author_name,
                    text,
                    created_at
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching social feed:', error);
            return { data: [], error };
        }

        return { data, error: null };
    },

    // Create a new post (with optional image)
    async createPost(userId: string, authorName: string, authorAvatar: string, content: string, imageFile?: File) {
        let imageUrl = null;

        // 1. Upload Image if exists
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('social_images')
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                return { error: uploadError };
            }

            const { data } = supabase.storage
                .from('social_images')
                .getPublicUrl(filePath);

            imageUrl = data.publicUrl;
        }

        // 2. Insert Post
        const { data, error } = await supabase
            .from('social_posts')
            .insert({
                user_id: userId,
                author_name: authorName,
                author_avatar: authorAvatar,
                content: content,
                image_url: imageUrl,
                is_bot: false
            })
            .select()
            .single();

        return { data, error };
    },

    // Like a post
    async likePost(userId: string, postId: string) {
        const { error } = await supabase
            .from('social_likes')
            .insert({ user_id: userId, post_id: postId });
        return { error };
    },

    // Unlike a post
    async unlikePost(userId: string, postId: string) {
        const { error } = await supabase
            .from('social_likes')
            .delete()
            .eq('user_id', userId)
            .eq('post_id', postId);
        return { error };
    },

    // Comment on a post
    async commentOnPost(userId: string, postId: string, authorName: string, text: string) {
        const { data, error } = await supabase
            .from('social_comments')
            .insert({
                user_id: userId,
                post_id: postId,
                author_name: authorName,
                text: text
            })
            .select()
            .single();
        return { data, error };
    }
};
