import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, UserPlus, Send, Camera, MoreHorizontal, UserCheck, CheckCircle2, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { dataService } from '../services/dataService';
import { authService } from '../services/authService';

interface Post {
    id: string;
    author: {
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

interface SocialFeedProps {
    onBack: () => void;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ onBack }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    const [friends, setFriends] = useState<string[]>([]);
    const [newPostText, setNewPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        const loadFeed = async () => {
            setLoading(true);

            // 1. Get User
            const { session } = await authService.getSession();
            if (!session?.user) {
                setLoading(false);
                return;
            }
            setCurrentUserId(session.user.id);

            // 2. Get Profile (for author info)
            const { data: profile } = await dataService.getProfile(session.user.id);
            setCurrentUserProfile(profile);

            // 3. Get Feed
            await refreshFeed(session.user.id);
            setLoading(false);
        };
        loadFeed();
    }, []);

    const refreshFeed = async (userId: string) => {
        const { data: feedData, error } = await dataService.getSocialFeed();
        if (error || !feedData) {
            console.error("Failed to load feed", error);
            return;
        }

        const formattedPosts: Post[] = feedData.map((item: any) => ({
            id: item.id,
            author: {
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

        // Optimistic Update
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    isLiked: !post.isLiked
                };
            }
            return post;
        }));

        const isLiked = posts.find(p => p.id === postId)?.isLiked;
        if (isLiked) {
            await dataService.unlikePost(currentUserId, postId);
        } else {
            await dataService.likePost(currentUserId, postId);
        }
    };

    const handleAddFriend = (authorName: string) => {
        if (friends.includes(authorName)) {
            setFriends(friends.filter(f => f !== authorName));
        } else {
            setFriends([...friends, authorName]);
        }
    };

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file); // Keep file for upload
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePost = async () => {
        if ((!newPostText.trim() && !selectedImage) || !currentUserId || !currentUserProfile) return;

        // Optimistic UI update (temporary)
        const tempId = Date.now().toString();
        const tempPost: Post = {
            id: tempId,
            author: {
                name: currentUserProfile.full_name || 'You',
                avatarColor: '#818CF8',
                isBot: false
            },
            content: newPostText,
            image: selectedImage || undefined,
            likes: 0,
            comments: [],
            isLiked: false,
            timestamp: Date.now()
        };
        setPosts([tempPost, ...posts]);
        setNewPostText('');
        setSelectedImage(null);
        setSelectedFile(null);

        // Actual Save
        const { error } = await dataService.createPost(
            currentUserId,
            currentUserProfile.full_name || 'You',
            '#818CF8', // Default user color
            newPostText,
            selectedFile || undefined
        );

        if (error) {
            alert("Failed to post: " + error.message);
            // Revert on failure could be added here
        } else {
            // Refresh to get real ID and image URL
            refreshFeed(currentUserId);
        }
    };

    const handleComment = async (postId: string) => {
        if (!commentText.trim() || !currentUserId || !currentUserProfile) return;

        // Optimistic Update
        const tempComment = { id: Date.now().toString(), author: currentUserProfile.full_name || 'You', text: commentText };
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    comments: [...post.comments, tempComment]
                };
            }
            return post;
        }));

        const textToSend = commentText;
        setCommentText('');
        setActiveCommentPost(null);

        await dataService.commentOnPost(currentUserId, postId, currentUserProfile.full_name || 'You', textToSend);
    };

    return (
        <div className="h-full flex flex-col bg-stone-50">
            {/* Header */}
            <div className="bg-white p-4 border-b border-stone-200 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <h2 className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent italic tracking-tighter">SocialSphere</h2>
                <div className="flex gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full">
                        <MoreHorizontal size={24} className="text-stone-400" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Create Post */}
                <div className="bg-white p-4 mb-2 border-b border-stone-100">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center flex-shrink-0 text-white font-bold">
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
                                    onChange={handleImageSelect}
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
                                    className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed */}
                <div className="pb-20 space-y-4">
                    {loading ? (
                        <div className="p-8 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">Loading Feed...</div>
                    ) : (
                        posts.length === 0 ? (
                            <div className="p-8 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">No posts yet. Be the first!</div>
                        ) : (
                            posts.map(post => (
                                <div key={post.id} className="bg-white border-b border-stone-100 pb-2">
                                    {/* Post Header */}
                                    <div className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: post.author.avatarColor }}>
                                                {post.author.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1">
                                                    <h3 className="font-bold text-sm text-stone-800">{post.author.name}</h3>
                                                    {post.author.isBot && <CheckCircle2 size={12} className="text-blue-500 fill-blue-100" />}
                                                </div>
                                                <span className="text-[10px] text-stone-400 font-medium">
                                                    {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        {!post.author.isBot && post.author.name !== (currentUserProfile?.full_name) && (
                                            <button
                                                onClick={() => handleAddFriend(post.author.name)}
                                                className={`p-2 rounded-full transition-all ${friends.includes(post.author.name)
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-stone-50 text-stone-400 hover:bg-purple-50 hover:text-purple-500'
                                                    }`}
                                            >
                                                {friends.includes(post.author.name) ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                            </button>
                                        )}
                                        {/* Allow friending bots too if user wants */}
                                        {post.author.isBot && (
                                            <button
                                                onClick={() => handleAddFriend(post.author.name)}
                                                className={`p-2 rounded-full transition-all ${friends.includes(post.author.name)
                                                        ? 'bg-green-100 text-green-600'
                                                        : 'bg-stone-50 text-stone-400 hover:bg-purple-50 hover:text-purple-500'
                                                    }`}
                                            >
                                                {friends.includes(post.author.name) ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="px-4 py-2">
                                        <p className="text-stone-800 text-sm leading-relaxed mb-2">{post.content}</p>
                                        {post.image && (
                                            <div className="rounded-xl overflow-hidden mb-2 border border-stone-100">
                                                <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-64" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="px-4 py-3 flex items-center gap-6">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className={`flex items-center gap-1.5 group ${post.isLiked ? 'text-red-500' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            <Heart size={22} className={`transition-transform group-active:scale-125 ${post.isLiked ? 'fill-current' : ''}`} />
                                            <span className="text-xs font-bold">{post.likes}</span>
                                        </button>

                                        <button
                                            onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                            className="flex items-center gap-1.5 text-stone-400 hover:text-stone-600"
                                        >
                                            <MessageCircle size={22} />
                                            <span className="text-xs font-bold">{post.comments.length}</span>
                                        </button>
                                    </div>

                                    {/* Comments Section */}
                                    {(activeCommentPost === post.id || post.comments.length > 0) && (
                                        <div className="px-4 pb-3">
                                            {post.comments.map(comment => (
                                                <div key={comment.id} className="mb-2 text-xs">
                                                    <span className="font-bold mr-2 text-stone-700">{comment.author}</span>
                                                    <span className="text-stone-600">{comment.text}</span>
                                                </div>
                                            ))}
                                            {activeCommentPost === post.id && (
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-stone-100">
                                                    <input
                                                        type="text"
                                                        placeholder="Add a comment..."
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                                        className="flex-1 bg-stone-50 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-200"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleComment(post.id)}
                                                        className="text-purple-600 font-bold text-xs"
                                                    >
                                                        Post
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialFeed;
