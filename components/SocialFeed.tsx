import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, UserPlus, Send, Camera, MoreHorizontal, UserCheck, CheckCircle2, X, Trophy, Users, Newspaper, MessageSquare } from 'lucide-react';
import { ChatMessage, GameState, ZoneType, FurnitureItem } from '../types';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';
import PixelGarden from './PixelGarden';

interface Post {
    id: string;
    author: {
        id: string; // Added ID
        name: string;
        avatarColor: string;
        isBot: boolean;
    };
    content: string;
    image?: string;
    likes: number;
    comments: Comment[];
    isLiked: boolean;
    timestamp: number;
}

interface Comment {
    id: string;
    author: string;
    text: string;
}

interface Friend {
    id: string;
    full_name: string;
    level: number;
    streak?: number;
}

interface Achievement {
    id: string;
    type: string;
    details: string;
    created_at: string;
}

interface DirectMessage {
    id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

interface FriendRequest {
    id: string;
    requester: {
        id: string;
        full_name: string;
        level: number;
        avatar_url?: string;
    };
    created_at: string;
}

interface Conversation {
    id: string;
    full_name: string;
    level: number;
    avatar_url?: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
}

const BOT_PERSONAS = [
    { id: 'bot-sprout', name: 'Sprout 🌱', avatarColor: '#10B981', role: 'Guide' },
    { id: 'bot-flex', name: 'Coach Flex 💪', avatarColor: '#F59E0B', role: 'Trainer' },
    { id: 'bot-bite', name: 'Bite-Sized 🍎', avatarColor: '#EF4444', role: 'Nutritionist' },
    { id: 'bot-triage', name: 'Dr. Triage 🩺', avatarColor: '#3B82F6', role: 'Doctor' }
];

const CONTENT_BANK: Record<string, string[]> = {
    'bot-sprout': [
        "Small steps every day lead to big changes! 🌿 Keep growing!",
        "Did you know? Consistency is key to habit formation. You're doing great!",
        "Take a moment to breathe deeply. 🧘 Your mental garden needs water too.",
        "Every checkmark is a victory. Celebrate your progress today! 🎉",
        "Your village is thriving because YOU are thriving. Keep it up! 🏡"
    ],
    'bot-flex': [
        "No pain, no gain? Nah, just consistency! Move your body today! 🏃‍♂️",
        "Stretch it out! Your future self will thank you. 🧘‍♀️",
        "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't. 💪",
        "Hydrate and dominate! 💧 Don't forget your water bottle!",
        "Rest days are just as important as training days. Listen to your body. 🛌"
    ],
    'bot-bite': [
        "Eat the rainbow today! 🌈 Fruits and veggies power your pixel life.",
        "Water is life! 💧 Have you had a glass recently?",
        "Balance is everything. Enjoy your treats, but nourish your body first! 🍪🥗",
        "Fuel your body, fuel your mind. What's for lunch? 🥗",
        "Healthy eating isn't about restriction, it's about nourishment! 🍎"
    ],
    'bot-triage': [
        "Sleep is the best medicine. 😴 Aim for those 7-8 hours tonight!",
        "Mental health check: How are you feeling today? It's okay to not be okay. ❤️",
        "Stress less, live more. Take 5 minutes for yourself. ⏳",
        "Prevention is better than cure. Wash your hands and stay safe! 🧼",
        "Listen to your body's signals. It knows what it needs. 👂"
    ]
};

interface SocialFeedProps {
    onBack: () => void;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'achievements' | 'inbox'>('feed');

    // Data States
    const [posts, setPosts] = useState<Post[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [potentialFriends, setPotentialFriends] = useState<Friend[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);

    // Visit Logic
    const [visitingProfile, setVisitingProfile] = useState<Friend | null>(null);
    const [visitingVillage, setVisitingVillage] = useState<boolean>(false);
    const [visitingGameState, setVisitingGameState] = useState<GameState | null>(null);

    const [messages, setMessages] = useState<DirectMessage[]>([]);
    const [newMessageText, setNewMessageText] = useState('');

    // Post Creation
    const [newPostText, setNewPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const activeCommentPost = useRef<string | null>(null);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of chat
    useEffect(() => {
        if (activeChatFriend) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeChatFriend]);

    // Initial Load
    useEffect(() => {
        const loadUser = async () => {
            const { session } = await authService.getSession();
            if (session?.user) {
                setCurrentUserId(session.user.id);
                const { data: profile } = await dataService.getProfile(session.user.id);
                setCurrentUserProfile(profile);
                loadTabContent(activeTab, session.user.id);
            }
        };
        loadUser();
    }, [activeTab]);

    // Daily Bot Posts Logic
    useEffect(() => {
        const checkDailyBotPosts = () => {
            const today = new Date().toISOString().split('T')[0];
            const lastPostDate = localStorage.getItem('last_bot_post_date');

            if (lastPostDate !== today) {
                // Generate posts
                const newBotPosts: Post[] = BOT_PERSONAS.map(bot => {
                    const messages = CONTENT_BANK[bot.id];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    return {
                        id: `post-${bot.id}-${Date.now()}`,
                        author: {
                            id: bot.id,
                            name: bot.name,
                            avatarColor: bot.avatarColor,
                            isBot: true
                        },
                        content: randomMessage,
                        likes: Math.floor(Math.random() * 50) + 10, // Fake initial likes
                        comments: [],
                        isLiked: false,
                        timestamp: Date.now()
                    };
                });

                // Prepend to posts (client-side only for now to simulate feed activity)
                // In a real app, these would be in the DB. We'll just add them to view state.
                setPosts(prev => [...newBotPosts, ...prev]);

                // Save to localStorage to prevent re-posting today
                localStorage.setItem('last_bot_post_date', today);
                console.log("Generated daily bot posts!", newBotPosts);
            }
        };

        // Run check after a short delay to ensure posts state might be loaded (though we prepend)
        // Or just run it.
        const timer = setTimeout(checkDailyBotPosts, 2000);
        return () => clearTimeout(timer);
    }, []); // Run once on mount

    const loadTabContent = async (tab: string, userId: string) => {
        setLoading(true);
        if (tab === 'feed') {
            await refreshFeed(userId);
        } else if (tab === 'friends') {
            const { data: friendsData } = await dataService.getFriends(userId);
            setFriends(friendsData || []);
            const { data: reqs } = await dataService.getFriendRequests(userId);
            setFriendRequests(reqs || []);
            const { data: potential } = await dataService.getPotentialFriends(userId);
            setPotentialFriends(potential || []);
        } else if (tab === 'achievements') {
            const { data: ach } = await dataService.getAchievements();
            setAchievements(ach || []);
        } else if (tab === 'inbox') {
            const { data: convs } = await dataService.getAllConversations(userId);
            setConversations(convs || []);
        }
        setLoading(false);
    };
    const refreshFeed = async (userId: string) => {
        const { data: feedData, error } = await dataService.getSocialFeed();
        if (error || !feedData) return;

        const formattedPosts: Post[] = feedData.map((item: any) => ({
            id: item.id,
            author: {
                id: item.user_id, // Map user_id to author.id
                name: item.author_name,
                avatarColor: item.author_avatar,
                isBot: item.is_bot
            },
            content: item.content,
            image: item.image_url,
            likes: item.social_likes?.length || 0,
            isLiked: item.social_likes?.some((like: any) => like.user_id === userId),
            comments: item.social_comments?.map((c: any) => ({
                id: c.id,
                author: c.author_name,
                text: c.text
            })) || [],
            timestamp: new Date(item.created_at).getTime()
        }));
        setPosts(formattedPosts);
    };

    const handleLike = async (postId: string) => {
        if (!currentUserId) return;
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked } : p));
        const post = posts.find(p => p.id === postId);
        if (post) toggleLike(post);
    };

    const toggleLike = async (post: Post) => {
        if (!currentUserId) return;
        if (post.isLiked) {
            await dataService.unlikePost(currentUserId, post.id);
        } else {
            await dataService.likePost(currentUserId, post.id);
        }
    };

    const handlePost = async () => {
        if ((!newPostText.trim() && !selectedImage) || !currentUserId || !currentUserProfile) return;
        setNewPostText('');
        setSelectedImage(null);
        setSelectedFile(null);
        await dataService.createPost(currentUserId, currentUserProfile.full_name || 'You', '#818CF8', newPostText, selectedFile || undefined);
        refreshFeed(currentUserId);
    };

    const handleComment = async (postId: string) => {
        if (!commentText.trim() || !currentUserId || !currentUserProfile) return;
        const text = commentText;
        setCommentText('');
        setActiveCommentPostId(null);
        await dataService.commentOnPost(currentUserId, postId, currentUserProfile.full_name || 'You', text);
        refreshFeed(currentUserId);
    };

    const handleAddFriend = async (friendId: string) => {
        if (!currentUserId) return;
        const res = await dataService.sendFriendRequest(currentUserId, friendId);
        if (res.error) alert(res.error);
        else {
            alert("Friend Request Sent!");
            // loadTabContent('friends', currentUserId); // No need to reload, just show feedback
        }
    };

    const handleRespondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
        if (!currentUserId) return;
        setLoading(true);
        await dataService.respondToFriendRequest(requestId, action);
        await loadTabContent('friends', currentUserId);
        setLoading(false);
    };

    // Chat Logic
    const openChat = async (friend: Friend) => {
        setActiveChatFriend(friend);
        if (currentUserId) {
            const { data } = await dataService.getDirectMessages(currentUserId, friend.id);
            setMessages(data || []);
        }
    };

    const sendMessage = async () => {
        if (!newMessageText.trim() || !currentUserId || !activeChatFriend) return;
        const text = newMessageText;
        setNewMessageText('');
        // Optimistic
        setMessages(prev => [...prev, { id: 'temp-' + Date.now(), sender_id: currentUserId, content: text, created_at: new Date().toISOString() }]);

        const { error } = await dataService.sendDirectMessage(currentUserId, activeChatFriend.id, text);
        if (error) {
            console.error('Error sending message:', error);
            alert(`Failed to send message: ${error.message}`);
            // Remove optimistic update if failed?
            setMessages(prev => prev.filter(m => m.content !== text)); // simple rollback
            return;
        }

        // Refresh?
        const { data } = await dataService.getDirectMessages(currentUserId, activeChatFriend.id);
        setMessages(data || []);
    };

    // --- RENDER HELPERS ---

    const handleProfileClick = async (userId: string, name: string, level: number) => {
        if (userId === currentUserId) return; // Don't visit self
        setVisitingProfile({ id: userId, full_name: name, level, streak: 0 }); // Optimistic / Placeholder

        // Fetch full profile for streak and accurate level
        const { data } = await dataService.getProfile(userId);
        if (data) {
            setVisitingProfile(prev => prev?.id === userId ? { ...prev, streak: data.streak_count || 0, level: data.level } : prev);
        }
    };

    const handleAddFriendFromProfile = async () => {
        if (!currentUserId || !visitingProfile) return;
        const res = await dataService.sendFriendRequest(currentUserId, visitingProfile.id);
        if (res.error) {
            alert(res.error);
        } else {
            alert("Friend Request Sent!");
            // setVisitingProfile(null); 
        }
    };

    const handleVisitVillage = async () => {
        if (!visitingProfile) return;
        setLoading(true);
        const { data: profile } = await dataService.getProfile(visitingProfile.id);

        if (profile) {
            // Map UserProfile (snake_case) to GameState (camelCase)
            const gameState: GameState = {
                score: profile.score || 0,
                level: profile.level || 1,
                maxScoreForLevel: profile.max_score_for_level || 100,
                inventory: profile.inventory || [], // Already same type
                placedItems: profile.placed_items || [],
                unlockedZones: (profile.unlocked_zones as ZoneType[]) || ['home'],
                removedTrees: profile.removed_trees || [],
                reminders: [], // Not needed for visual
                restaurantXP: profile.restaurant_xp || 0,
                restaurantLevel: profile.restaurant_level || 1,
                streak: profile.streak_count || 0,
                lastCompletedDate: profile.last_completed_date || null
            };
            setVisitingGameState(gameState);
            setVisitingVillage(true);
        } else {
            alert("Could not load village data.");
        }
        setLoading(false);
    };

    // Profile Visit Logic (Full Screen now)
    if (visitingVillage && visitingGameState && visitingProfile) {
        return (
            <div className="h-full flex flex-col bg-stone-900 relative">
                {/* Overlay Header */}
                <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-start pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-md p-2 rounded-xl pointer-events-auto">
                        <button onClick={() => setVisitingVillage(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl pointer-events-auto">
                        <h3 className="font-bold text-white text-sm">Visiting {visitingProfile.full_name}'s Village</h3>
                    </div>
                </div>

                {/* Read-Only Pixel Garden */}
                <div className="flex-1 overflow-hidden">
                    <PixelGarden
                        gameState={visitingGameState}
                        currentTime={new Date()}
                        isVisible={true}
                        onRemoveTree={() => false} // No-op
                        onTrainClick={() => { }}
                        onCampingClick={() => { }}
                        onRestaurantClick={() => { }}
                        onHospitalClick={() => { }}
                        onGymClick={() => { }}
                        onSevaHubClick={() => { }}
                        onYogaClick={() => { }}
                        onSproutClick={() => { }}
                        onShopOpen={() => { }}
                        onPlaceItem={() => { }}
                        notifications={[]}
                    />
                </div>
            </div>
        );
    }

    if (visitingProfile) {
        const isAlreadyFriend = friends.some(f => f.id === visitingProfile.id);

        return (
            <div className="h-full flex flex-col bg-stone-50">
                <div className="bg-white p-4 border-b border-stone-200 flex items-center gap-4 sticky top-0 z-10">
                    <button onClick={() => setVisitingProfile(null)} className="p-2 hover:bg-stone-100 rounded-full">
                        <X size={20} className="text-stone-600" />
                    </button>
                    <h3 className="font-bold text-stone-800">Homestead Visit</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-6">
                    {/* Avatar & Info */}
                    <div className="bg-white p-6 rounded-3xl border-4 border-stone-200 shadow-xl flex flex-col items-center w-full max-w-sm">
                        <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-black border-4 border-indigo-200 mb-4">
                            {visitingProfile.full_name[0]}
                        </div>
                        <h2 className="text-2xl font-black text-stone-800">{visitingProfile.full_name}</h2>
                        <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mt-2 border border-yellow-200">
                            Level {visitingProfile.level} Resident
                        </div>

                        <div className="mt-6 flex flex-col gap-3 w-full">
                            {/* Message */}
                            <button
                                onClick={() => { setVisitingProfile(null); openChat(visitingProfile); }}
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
                            >
                                <MessageCircle size={20} /> Message
                            </button>

                            {/* Add Friend */}
                            {!isAlreadyFriend && (
                                <button
                                    onClick={() => handleAddFriendFromProfile()}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                                >
                                    <UserPlus size={20} /> Add Friend
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="w-full max-w-sm grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100">
                            <div className="text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">Habit Streak</div>
                            <div className="text-2xl font-black text-emerald-600">{visitingProfile.streak || 0} 🔥</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-100">
                            <div className="text-orange-800 font-bold text-xs uppercase tracking-wider mb-1">XP Earned</div>
                            <div className="text-2xl font-black text-orange-600">-- ⚡</div>
                        </div>
                    </div>

                    <div className="mt-8 text-center pb-8 w-full max-w-sm">
                        <p className="text-stone-400 text-sm font-bold uppercase tracking-widest mb-4">Village Snapshot</p>
                        <button
                            onClick={handleVisitVillage}
                            className="w-full h-40 bg-stone-200 rounded-xl border-4 border-stone-300 flex flex-col items-center justify-center hover:bg-stone-300 transition-colors group relative overflow-hidden"
                        >
                            {/* Placeholder Background (optional) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100 opacity-50" />

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="bg-white p-3 rounded-full shadow-md mb-2 group-hover:scale-110 transition-transform">
                                    <Users size={24} className="text-stone-500" />
                                </div>
                                <span className="font-bold text-stone-600">Tap to Visit Village</span>
                                <span className="text-xs text-stone-400 mt-1">See {visitingProfile.full_name}'s progress!</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (activeChatFriend) {
        return (
            <div className="h-full flex flex-col bg-stone-50">
                <div className="bg-white p-4 border-b border-stone-200 flex items-center gap-4 sticky top-0 z-10">
                    <button onClick={() => setActiveChatFriend(null)} className="p-2 hover:bg-stone-100 rounded-full">
                        <X size={20} className="text-stone-600" />
                    </button>
                    <div className="flex-1">
                        <h3 className="font-bold text-stone-800">{activeChatFriend.full_name}</h3>
                        <p className="text-xs text-stone-400">Level {activeChatFriend.level}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    <div className="flex flex-col gap-3 min-h-full justify-end">
                        {messages.length === 0 && (
                            <div className="text-center text-stone-300 text-xs font-bold uppercase tracking-widest mt-10 mb-auto">Start the conversation!</div>
                        )}
                        {messages.map((msg) => {
                            const isMe = msg.sender_id === currentUserId;
                            return (
                                <div key={msg.id} className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-purple-600 text-white self-end rounded-tr-sm shadow-md' : 'bg-white border border-stone-200 text-stone-800 self-start rounded-tl-sm shadow-sm'}`}>
                                    {msg.content}
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <div className="p-3 bg-white border-t border-stone-200 flex gap-2">
                    <input
                        type="text"
                        value={newMessageText}
                        onChange={e => setNewMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-purple-300 transition-colors"
                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    />
                    <button onClick={sendMessage} className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 shadow-md transition-transform active:scale-95">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-stone-50">
            {/* Header with Tabs */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                    <h2 className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent italic tracking-tighter">SocialSphere</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTab('inbox')} className="p-2 hover:bg-stone-100 rounded-full relative">
                            <MessageCircle size={24} className={activeTab === 'inbox' ? "text-purple-600" : "text-stone-400"} />
                            {/* Unread badge logic could go here */}
                        </button>
                        <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full">
                            <X size={24} className="text-stone-400" />
                        </button>
                    </div>
                </div>
                <div className="flex">
                    <button onClick={() => setActiveTab('feed')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'feed' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-stone-400 hover:text-stone-600'}`}>
                        <Newspaper size={16} /> Feed
                    </button>
                    <button onClick={() => setActiveTab('friends')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'friends' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-stone-400 hover:text-stone-600'}`}>
                        <Users size={16} /> Friends
                    </button>
                    <button onClick={() => setActiveTab('achievements')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'achievements' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-stone-400 hover:text-stone-600'}`}>
                        <Trophy size={16} /> Awards
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide bg-stone-50">
                {activeTab === 'feed' && (
                    <div className="pb-20 space-y-4 pt-2">
                        {/* Create Post */}
                        <div className="bg-white p-4 mb-2 border-b border-stone-100">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm">
                                    {(currentUserProfile?.full_name?.[0]) || 'Y'}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="What's on your mind?"
                                        value={newPostText}
                                        onChange={(e) => setNewPostText(e.target.value)}
                                        className="w-full bg-stone-50 p-3 rounded-xl border border-stone-200 focus:outline-none focus:border-purple-300 transition-all text-sm mb-2"
                                    />
                                    {selectedImage && (
                                        <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden group">
                                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
                                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setSelectedFile(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setSelectedImage(reader.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-stone-400 hover:text-purple-500 transition-colors"
                                        >
                                            <Camera size={20} />
                                        </button>
                                        <button
                                            onClick={handlePost}
                                            disabled={!newPostText.trim() && !selectedImage}
                                            className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-md hover:bg-purple-700 transition-colors"
                                        >
                                            Post
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {loading ? <div className="p-8 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">Loading...</div> :
                            posts.map(post => (
                                <div key={post.id} className="bg-white border-b border-stone-100 pb-2">
                                    <div className="p-3 flex items-center justify-between">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => {
                                                console.log("Clicked author:", post.author);
                                                if (post.author.id) {
                                                    handleProfileClick(post.author.id, post.author.name, 0); // Passing 0 as level for now if not available
                                                } else {
                                                    console.error("No author ID found on post:", post);
                                                    alert("Error: Could not find user details.");
                                                }
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: post.author.avatarColor }}>
                                                {post.author.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <h3 className="font-bold text-sm text-stone-800 hover:text-purple-600 transition-colors">{post.author.name}</h3>
                                                    {post.author.isBot && <CheckCircle2 size={12} className="text-blue-500 fill-blue-100" />}
                                                </div>
                                                <span className="text-[10px] text-stone-400 font-medium">
                                                    {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2">
                                        <p className="text-stone-800 text-sm leading-relaxed mb-2">{post.content}</p>
                                        {post.image && (
                                            <div className="rounded-xl overflow-hidden mb-2 border border-stone-100">
                                                <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-64" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 flex items-center gap-6">
                                        <button onClick={() => toggleLike(post)} className={`flex items-center gap-1.5 group ${post.isLiked ? 'text-red-500' : 'text-stone-400 hover:text-stone-600'}`}>
                                            <Heart size={22} className={`transition-transform group-active:scale-125 ${post.isLiked ? 'fill-current' : ''}`} />
                                            <span className="text-xs font-bold">{post.likes}</span>
                                        </button>
                                        <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600">
                                            <MessageCircle size={22} />
                                            <span className="text-xs font-bold">{post.comments.length}</span>
                                        </button>
                                    </div>
                                    {(activeCommentPostId === post.id || post.comments.length > 0) && (
                                        <div className="px-4 pb-3">
                                            {post.comments.map(comment => (
                                                <div key={comment.id} className="mb-2 text-xs">
                                                    <span className="font-bold mr-2 text-stone-700">{comment.author}</span>
                                                    <span className="text-stone-600">{comment.text}</span>
                                                </div>
                                            ))}
                                            {activeCommentPostId === post.id && (
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-stone-100">
                                                    <input type="text" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleComment(post.id)} className="flex-1 bg-stone-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-200" autoFocus />
                                                    <button onClick={() => handleComment(post.id)} className="text-purple-600 font-bold text-xs">Post</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}

                {activeTab === 'friends' && (
                    <div className="p-4 space-y-6">
                        {loading && <div className="text-center text-stone-400 text-xs font-bold uppercase tracking-widest">Loading...</div>}

                        {/* Friend Requests */}
                        {friendRequests.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    Pending Requests <span className="bg-red-100 text-red-600 px-2 rounded-full text-[10px]">{friendRequests.length}</span>
                                </h3>
                                <div className="space-y-3">
                                    {friendRequests.map(req => (
                                        <div key={req.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center font-bold">
                                                    {req.requester.full_name[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-stone-800 text-sm">{req.requester.full_name}</h4>
                                                    <span className="text-xs text-stone-400">Level {req.requester.level}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleRespondToRequest(req.id, 'accept')} className="bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-md hover:bg-stone-700">
                                                    Confirm
                                                </button>
                                                <button onClick={() => handleRespondToRequest(req.id, 'reject')} className="bg-stone-100 text-stone-500 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-stone-200">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* My Friends List */}
                        <div>
                            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">My Friends ({friends.length})</h3>
                            <div className="space-y-3">
                                {friends.length === 0 ? (
                                    <div className="text-sm text-stone-400 italic">No friends yet. Add some below!</div>
                                ) : (
                                    friends.map(friend => (
                                        <div key={friend.id} className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                                                    {friend.full_name[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-stone-800 text-sm">{friend.full_name}</h4>
                                                    <span className="text-xs text-stone-400">Level {friend.level}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => openChat(friend)} className="p-2 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200">
                                                <MessageSquare size={18} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div>
                            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Community Members</h3>
                            <div className="space-y-3">
                                {potentialFriends.map(pf => {
                                    const isFriend = friends.some(f => f.id === pf.id);
                                    if (isFriend) return null;
                                    // Check if I sent a request (UI doesn't track this yet perfectly without another query, but assuming button feedback is enough)
                                    return (
                                        <div key={pf.id} className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between shadow-sm opacity-80">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center font-bold">
                                                    {pf.full_name[0]}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-stone-800 text-sm">{pf.full_name}</h4>
                                                    <span className="text-xs text-stone-400">Level {pf.level}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleAddFriend(pf.id)} className="text-xs font-bold text-blue-600 uppercase tracking-wider px-3 py-1 bg-blue-50 rounded-full">
                                                + Add
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'achievements' && (
                    <div className="p-4 space-y-4">
                        {loading && <div className="text-center text-stone-400 text-xs font-bold uppercase tracking-widest">Loading Awards...</div>}
                        {achievements.map((ach) => (
                            <div key={ach.id} className="bg-white p-3 rounded-xl border-l-4 border-yellow-400 shadow-sm flex items-start gap-3">
                                <div className="mt-1">
                                    {ach.type === 'level_up' ? <Trophy size={18} className="text-yellow-500" /> : <UserPlus size={18} className="text-blue-500" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-800">{ach.details}</p>
                                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">
                                        {new Date(ach.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'inbox' && (
                    <div className="p-4 space-y-4">
                        {loading && <div className="text-center text-stone-400 text-xs font-bold uppercase tracking-widest">Loading Chats...</div>}
                        {conversations.length === 0 && !loading && (
                            <div className="text-center text-stone-400 text-xs italic mt-10">No messages yet. Start a chat from Friends!</div>
                        )}
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => {
                                    // Construct a Friend object to open chat
                                    openChat({ id: conv.id, full_name: conv.full_name, level: conv.level });
                                }}
                                className={`bg-white p-3 rounded-xl border flex items-center justify-between shadow-sm cursor-pointer hover:bg-stone-50 transition-colors ${conv.unread ? 'border-purple-300 bg-purple-50' : 'border-stone-200'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold flex-shrink-0">
                                        {conv.full_name[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-sm truncate ${conv.unread ? 'font-black text-stone-900' : 'font-bold text-stone-700'}`}>{conv.full_name}</h4>
                                            {conv.unread && <div className="w-2 h-2 bg-purple-500 rounded-full" />}
                                        </div>
                                        <p className={`text-xs truncate ${conv.unread ? 'text-stone-800 font-medium' : 'text-stone-400'}`}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-[10px] text-stone-400 font-bold whitespace-nowrap pl-2">
                                    {new Date(conv.timestamp).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals and Overlays */}
            {/* Modals and Overlays */}
            {/* Previously renderProfileModal() was here, now handled by conditional returns above */}
        </div>
    );
};

export default SocialFeed;
