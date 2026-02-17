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
            restaurant_xp: 0,
            restaurant_level: 1,
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

        // Trigger "New User" Achievement
        await this.createAchievement('new_user', `${fullName} just joined Homestead!`);

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
        restaurant_xp?: number;
        restaurant_level?: number;
        streak?: number;
        lastCompletedDate?: string | null;
    }) {
        return this.updateProfile(userId, {
            level: state.level,
            score: state.score,
            max_score_for_level: state.maxScoreForLevel,
            inventory: state.inventory,
            placed_items: state.placedItems,
            unlocked_zones: state.unlockedZones,
            removed_trees: state.removedTrees,
            restaurant_xp: state.restaurant_xp,
            restaurant_level: state.restaurant_level,
            streak_count: state.streak,
            last_completed_date: state.lastCompletedDate || undefined
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
    },

    // --- ACHIEVEMENTS ---
    async getAchievements() {
        const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        return { data, error };
    },

    async createAchievement(type: string, details: string) {
        const { error } = await supabase
            .from('achievements')
            .insert({ type, details });
        return { error };
    },

    // --- FRIENDS ---
    async getFriends(userId: string) {
        // 1. Get all accepted friendships
        const { data: friendships, error } = await supabase
            .from('friendships')
            .select('*')
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (error) {
            console.error('Error fetching friends:', error);
            return { data: [], error };
        }

        if (!friendships || friendships.length === 0) return { data: [], error: null };

        // 2. Extract friend IDs
        const friendIds = friendships.map(f =>
            f.requester_id === userId ? f.receiver_id : f.requester_id
        );

        // 3. Fetch profiles
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, level')
            .in('id', friendIds);

        return { data: profiles || [], error: profileError };
    },

    async sendFriendRequest(requesterId: string, receiverId: string) {
        // Check if already friends or pending
        const { data: existing } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
            .single();

        if (existing) {
            if (existing.status === 'accepted') return { error: 'Already friends!' };
            if (existing.status === 'pending') return { error: 'Request already pending.' };
            // If rejected, maybe allow re-request? For now block.
            return { error: 'Cannot send request.' };
        }

        // Send PENDING request
        const { error } = await supabase
            .from('friendships')
            .insert({ requester_id: requesterId, receiver_id: receiverId, status: 'pending' });

        return { error };
    },

    async getFriendRequests(userId: string) {
        // Fetch rows where receiver is ME and status is PENDING
        const { data: requests, error } = await supabase
            .from('friendships')
            .select(`
                id,
                created_at,
                requester:profiles!requester_id (id, full_name, level)
            `)
            .eq('receiver_id', userId)
            .eq('status', 'pending');

        // Transform for easier UI consumption if needed, or return as is
        return { data: requests || [], error };
    },

    async respondToFriendRequest(requestId: string, action: 'accept' | 'reject') {
        if (action === 'accept') {
            const { error } = await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', requestId);
            return { error };
        } else {
            const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', requestId);
            return { error };
        }
    },


    // --- DIRECT MESSAGES ---
    async getDirectMessages(userId: string, friendId: string) {
        console.log(`Getting DMs between ${userId} and ${friendId}`);
        const { data, error } = await supabase
            .from('direct_messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (error) console.error('Error getting DMs:', error);
        else console.log(`Found ${data?.length} messages`);

        return { data, error };
    },

    async sendDirectMessage(senderId: string, receiverId: string, content: string) {
        const { error } = await supabase
            .from('direct_messages')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                content: content,
                read: false
            });
        return { error };
    },

    async getAllConversations(userId: string) {
        // Get all unique users I have chatted with
        // Simplest strategy: Fetch all messages involved with me, extract unique partner IDs
        const { data: messages, error } = await supabase
            .from('direct_messages')
            .select('sender_id, receiver_id, content, created_at, read')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        console.log('Fetching conversations for user:', userId);
        if (error) {
            console.error('Error fetching conversations:', error);
            return { data: [], error };
        }
        console.log('Messages fetched:', messages?.length);

        if (error || !messages) return { data: [], error };

        const partnerMap = new Map<string, any>();

        for (const msg of messages) {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            if (!partnerMap.has(partnerId)) {
                partnerMap.set(partnerId, {
                    partnerId,
                    lastMessage: msg.content,
                    timestamp: msg.created_at,
                    unread: msg.receiver_id === userId && !msg.read
                });
            }
        }

        const partnerIds = Array.from(partnerMap.keys());
        console.log('Unique partners:', partnerIds);

        // Fetch profiles for these partners
        if (partnerIds.length === 0) return { data: [], error: null };

        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, level')
            .in('id', partnerIds);

        if (profilesError) {
            console.error("Error fetching profiles for conversations:", profilesError);
            // Don't return error, just proceed with unknown profiles
        }

        console.log(`Fetched ${profiles?.length || 0} profiles for inbox.`);

        const conversations = partnerIds.map(pid => {
            const profile = profiles?.find(p => p.id === pid);
            const msgInfo = partnerMap.get(pid);
            return {
                id: pid,
                full_name: profile?.full_name || 'Unknown User',
                level: profile?.level || 1,
                ...msgInfo
            };
        }).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return { data: conversations || [], error: null };
    },

    async getPotentialFriends(currentUserId: string) {
        // accurate "potential friends" query is complex, for now just get last 10 active profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, level')
            .neq('id', currentUserId)
            .order('updated_at', { ascending: false })
            .limit(10);
        return { data, error };
    },

    async searchNutritionFacts(embedding: number[]) {
        const { data, error } = await supabase.rpc('match_nutrition_facts', {
            query_embedding: embedding,
            match_threshold: 0.5, // filter out low similarity
            match_count: 3        // get top 3 facts
        });
        return { data, error };
    },

    // --- DIAGNOSTICS ---
    async runDiagnostics(userId: string) {
        const { count: sentCount, error: sentError } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', userId);

        const { count: receivedCount, error: receivedError } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId);

        return {
            sent: sentCount || 0,
            received: receivedCount || 0,
            errors: [sentError, receivedError].filter(Boolean)
        };
    },
};
