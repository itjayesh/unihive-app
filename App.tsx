

import React, { useState, useEffect } from 'react';
import { type Page, type User, type Deal, type Trip, type ForumTopic, type ForumPost, TripStatus, type TripParticipant, type Recommendation, type AnalyticsEvent, UserStatus, type ChatMessage, MarketplaceItem, Negotiation } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import DealsPage from './pages/DealsPage';
import RecommendationsPage from './pages/RecommendationsPage';
import TravelPage from './pages/TravelPage';
import ForumPage from './pages/ForumPage';
import AdminPage from './pages/AdminPage';
import AuthModal from './components/AuthModal';
import Chatbot from './components/Chatbot';
import ChatbotIcon from './components/icons/ChatbotIcon';
import { generateTripItinerary, getChatbotResponse } from './services/geminiService';
import MarketplacePage from './pages/MarketplacePage';

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('unihive-users');
    if (savedUsers) {
      return JSON.parse(savedUsers);
    }
    return [{ id: 'admin-0', username: 'Admin', email: 'admin@unihive.io', password: 'admin123', role: 'admin', contactNumber: 'N/A', collegeName: 'UniHive Admin', verificationMethod: 'email', status: UserStatus.APPROVED }];
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('unihive-session');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // --- APP STATE ---
  const [currentPage, setCurrentPage] = useState<Page>('deals');
  const [isAdminView, setIsAdminView] = useState(false);
  const [approvingTripId, setApprovingTripId] = useState<string | null>(null);
  
  // --- ANALYTICS STATE ---
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>(() => {
    const savedEvents = localStorage.getItem('unihive-analytics');
    return savedEvents ? JSON.parse(savedEvents) : [];
  });
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // --- CHATBOT STATE ---
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState<ChatMessage[]>([
      { role: 'bot', content: "Hi there! I'm UniBot. How can I help you find deals, recommendations, or trips today?" }
  ]);

  // --- MOCK DATA STATE ---
  const [dealCategories, setDealCategories] = useState<string[]>(['Entertainment', 'Tech', 'Food', 'Fashion', 'Education']);
  const [subcategories, setSubcategories] = useState<string[]>(['Laptops', 'Streaming', 'Pizza', 'Apparel', 'Online Courses', 'Software', 'Study Spots', 'Cheap Eats']);
  const [cities, setCities] = useState<string[]>(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']);
  const [deals, setDeals] = useState<Deal[]>([
    { id: 'd1', title: '50% Off Gaana Plus', description: 'Listen to your favorite music ad-free.', imageUrl: 'https://images.unsplash.com/photo-1611162617213-6d22e4ca1c21?q=80&w=800&auto=format&fit=crop', category: 'Entertainment', link: 'https://example.com/gaana', couponCode: 'UNIHIVE50' },
    { id: 'd2', title: 'Student Laptop Deals on Flipkart', description: 'Get up to ₹5000 off on select laptops.', imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop', category: 'Tech', link: 'https://example.com/laptops' },
    { id: 'd3', title: '2-for-1 Pizza at Domino\'s', description: 'Grab a friend and enjoy double the pizza.', imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?q=80&w=800&auto=format&fit=crop', category: 'Food', couponCode: 'PIZZA4TWO' },
    { id: 'd4', title: '20% Off at Myntra', description: 'Upgrade your wardrobe with the latest trends.', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=800&auto=format&fit=crop', category: 'Fashion', link: 'https://example.com/myntra' },
     { id: 'd5', title: 'Free Month of Unacademy Plus', description: 'Learn a new skill with free access to thousands of courses.', imageUrl: 'https://images.unsplash.com/photo-1524995767962-b1f4b8949591?q=80&w=800&auto=format&fit=crop', category: 'Education', link: 'https://example.com/courses' },
  ]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => {
    const savedRecs = localStorage.getItem('unihive-recommendations');
    return savedRecs ? JSON.parse(savedRecs) : [
      { id: 'r1', title: 'Best Study Spot: British Council Library', description: 'Quiet, great resources, and has a nice cafe. Perfect for exam prep.', author: 'Priya S.', userId: 'user-1', locationType: 'physical', locationName: 'Mumbai', subcategory: 'Study Spots', upvotes: 42, upvotedBy: [], timestamp: '3 days ago', imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop', status: 'approved' },
      { id: 'r2', title: 'Free Software for Students: GitHub Student Pack', description: 'Get access to tons of free developer tools and resources. An absolute must for any CS student.', author: 'Rohan M.', userId: 'user-2', locationType: 'online', subcategory: 'Software', upvotes: 112, upvotedBy: [], timestamp: '1 week ago', imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=800&auto=format&fit=crop', link: 'https://education.github.com/pack', status: 'approved' },
      { id: 'r3', title: 'Cheap Eats: "₹100 Vada Pav" in Delhi', description: "The best vada pav you'll ever have, and it's incredibly cheap. Perfect for a quick lunch between classes.", author: 'Aisha K.', userId: 'user-3', locationType: 'physical', locationName: 'Delhi', subcategory: 'Cheap Eats', upvotes: 78, upvotedBy: [], timestamp: '2 days ago', imageUrl: 'https://images.unsplash.com/photo-1562823689-a8a205d21882?q=80&w=800&auto=format&fit=crop', status: 'approved' }
    ]
  });
  const [trips, setTrips] = useState<Trip[]>(() => {
    const savedTrips = localStorage.getItem('unihive-trips');
    return savedTrips ? JSON.parse(savedTrips) : [
      { id: 't1', destination: 'Backpacking in Himachal', proposer: 'Aditya', description: 'A 2-week adventure through Shimla, Manali, and Kasol. Looking for 5-7 other people.', waitlist: [], participants: [], maxParticipants: 8, status: TripStatus.PENDING },
      { id: 't2', destination: 'Goa Beach Trip', proposer: 'Sneha', description: 'A week of sun, sand, and sea in Goa. All are welcome.', waitlist: [{id: 'user-1', username: 'TestUser', contactNumber: '123'}], participants: [], maxParticipants: 12, status: TripStatus.APPROVED, itinerary: `## Itinerary for Goa Beach Trip\n\n**Day 1: Arrival in North Goa**\n- Arrive at Goa Airport (GOI) and take a taxi to Calangute.\n- Check into our budget-friendly hostel.\n- Evening: Welcome dinner at a local shack to try some Goan fish curry!\n\n**Day 2: Exploring North Goa**\n- Morning: Visit Calangute and Baga beaches.\n- Lunch: Packed lunches to save money.\n- Afternoon: Explore Anjuna flea market.\n\n...more days to follow` },
      { id: 't3', destination: 'Historical Tour of Jaipur', proposer: 'Karan', description: '4 days exploring the pink city. Hawa Mahal, Amer Fort, etc.', waitlist: [], participants: [{id: 'user-2', username: 'David', contactNumber: '456'}], maxParticipants: 6, status: TripStatus.RECRUITING },
    ]
  });
   const [topics, setTopics] = useState<ForumTopic[]>(() => {
    const savedTopics = localStorage.getItem('unihive-topics');
    return savedTopics ? JSON.parse(savedTopics) : [
      {
        id: 'ft1',
        title: 'Best way to prepare for CAT exams?',
        description: 'I have my exam coming up next month and I am totally freaking out. What are your best study hacks and tips to survive? Any advice would be appreciated!',
        author: 'StressedStudent',
        userId: 'user-1',
        timestamp: '5 hours ago',
        upvotes: 27,
        downvotes: 1,
        upvotedBy: [],
        downvotedBy: [],
        reportedBy: [],
        posts: [
          {id: 'p1', author: 'Jane', userId: 'user-2', message: 'I always use the Pomodoro Technique! 25 mins of focused work and then a 5 min break. It\'s a game changer.', timestamp: '2 hours ago', upvotes: 15, downvotes: 0, upvotedBy: [], downvotedBy: [], reportedBy: []},
          {id: 'p2', author: 'Mike', userId: 'user-3', message: 'Group study sessions are a life-saver for me. Explaining concepts to others really solidifies them in your own mind.', timestamp: '1 hour ago', upvotes: 8, downvotes: 0, upvotedBy: [], downvotedBy: [], reportedBy: []}
        ]
      },
      { id: 'ft2', title: 'Part-time job opportunities on campus', description: 'Know of any openings? Post them here. Looking for something in the library or cafe.', author: 'JobHunter', userId: 'user-4', timestamp: '2 days ago', upvotes: 12, downvotes: 0, upvotedBy: [], downvotedBy: [], reportedBy: [], posts: [] },
    ]
  });
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() => {
    const saved = localStorage.getItem('unihive-marketplace');
    if (saved) return JSON.parse(saved);
    return [
        { id: 'mkt-1', sellerId: 'user-2', sellerName: 'Karan', title: 'Used Mini-Fridge', description: 'Great condition, perfect for a dorm room. Selling because I\'m moving.', imageUrl: 'https://images.unsplash.com/photo-1588880331179-b0b639912753?q=80&w=800&auto=format&fit=crop', price: 4000, status: 'approved', negotiations: [], type: 'sell', sellerLocation: 'Mumbai', shippingAvailable: false },
        { id: 'mkt-2', sellerId: 'user-3', sellerName: 'Aisha K.', title: 'Barely Used Engineering Textbook', description: '"Intro to Engineering" - needed for Prof. Sharma\'s class. No highlighting!', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop', price: 1500, status: 'approved', negotiations: [], type: 'sell', sellerLocation: 'Delhi', shippingAvailable: true },
        { id: 'mkt-3', sellerId: 'user-4', sellerName: 'JobHunter', title: 'Acoustic Guitar for Rent', description: 'Good for beginners. A few scuffs but plays well. Comes with a case.', imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106945?q=80&w=800&auto=format&fit=crop', price: 500, status: 'approved', negotiations: [], type: 'rent', rentingPeriod: 'week', sellerLocation: 'Bangalore', shippingAvailable: false },
        { id: 'mkt-4', sellerId: 'user-1', sellerName: 'StressedStudent', title: 'Gaming Mouse', description: 'High DPI gaming mouse, works perfectly.', imageUrl: 'https://images.unsplash.com/photo-1615663249893-e7116be113e9?q=80&w=800&auto=format&fit=crop', price: 2000, status: 'sold', buyerInfo: { name: 'Buyer Bob', email: 'bob@test.com', phone: '555-1234' }, negotiations: [], type: 'sell', sellerLocation: 'Mumbai', shippingAvailable: true }
    ];
  });

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('unihive-users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('unihive-session', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('unihive-trips', JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem('unihive-topics', JSON.stringify(topics)); }, [topics]);
  useEffect(() => { localStorage.setItem('unihive-recommendations', JSON.stringify(recommendations)); }, [recommendations]);
  useEffect(() => { localStorage.setItem('unihive-analytics', JSON.stringify(analyticsEvents)); }, [analyticsEvents]);
  useEffect(() => { localStorage.setItem('unihive-marketplace', JSON.stringify(marketplaceItems)); }, [marketplaceItems]);
  
  // --- HANDLERS ---
  const logAnalyticsEvent = (eventData: Omit<AnalyticsEvent, 'timestamp' | 'userId'>) => {
    // Only log events for non-admin users
    if (currentUser && currentUser.role !== 'admin') {
        const event: AnalyticsEvent = {
            ...eventData,
            timestamp: Date.now(),
            userId: currentUser.id,
        };
        setAnalyticsEvents(prev => [...prev, event]);
    }
  };

  const handleLogin = (email: string, password: string): { success: boolean, message?: string } => {
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return { success: false, message: 'Invalid credentials. Please try again.' };
    }
    if (user.status === UserStatus.PENDING) {
        return { success: false, message: 'Your account is pending approval. Please wait for an admin to review it.' };
    }
    if (user.status === UserStatus.REJECTED) {
         return { success: false, message: 'Your account application was rejected.' };
    }
    if (user.status === UserStatus.APPROVED) {
      setCurrentUser(user);
      setAuthModalOpen(false);
      setIsAdminView(false);
      setCurrentPage('deals');
      if (user.role !== 'admin') {
          setSessionStartTime(Date.now());
      }
      return { success: true };
    }
    return { success: false, message: 'An unknown error occurred.' };
  };
  const handleSignup = (
    username: string, email: string, password: string, contactNumber: string,
    collegeName: string, verificationMethod: 'email' | 'id_card', idCardImageData?: string
  ): { success: boolean, pending: boolean, message?: string } => {
    if (users.some(u => u.email === email)) return { success: false, pending: false, message: 'This email is already taken.' };
    
    // A simple regex for common Indian .edu domains. This can be expanded.
    if (verificationMethod === 'email' && !email.endsWith('.edu') && !email.endsWith('.ac.in')) {
      return { success: false, pending: false, message: 'Please use a valid .edu or .ac.in email address for email verification.' };
    }

    const status = verificationMethod === 'email' ? UserStatus.APPROVED : UserStatus.PENDING;
    
    const newUser: User = { 
        id: `user-${Date.now()}`, 
        username, email, password, role: 'user', contactNumber,
        collegeName, verificationMethod,
        idCardImageUrl: verificationMethod === 'id_card' ? idCardImageData : undefined,
        status,
    };
    setUsers([...users, newUser]);

    if(status === UserStatus.APPROVED) {
        setCurrentUser(newUser);
        setSessionStartTime(Date.now());
    }

    return { success: true, pending: status === UserStatus.PENDING };
  };
  const handleLogout = () => {
    if (currentUser && currentUser.role !== 'admin' && sessionStartTime) {
        logAnalyticsEvent({
            type: 'session_duration',
            payload: { durationMs: Date.now() - sessionStartTime }
        });
    }
    setCurrentUser(null);
    setIsAdminView(false);
    setCurrentPage('deals');
    setSessionStartTime(null);
  };
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setIsAdminView(false);
  };
  const handleToggleAdminView = () => {
    if (currentUser?.role === 'admin') {
      setIsAdminView(!isAdminView);
    }
  }

  const handleApproveUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: UserStatus.APPROVED } : u));
  };
  const handleRejectUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleAddDealCategory = (category: string) => setDealCategories(prev => [...prev, category]);
  const handleDeleteDealCategory = (category: string) => setDealCategories(prev => prev.filter(c => c !== category));
  const handleAddSubcategory = (subcategory: string) => setSubcategories(prev => [...prev, subcategory]);
  const handleDeleteSubcategory = (subcategory: string) => setSubcategories(prev => prev.filter(s => s !== subcategory));
  const handleAddCity = (city: string) => setCities(prev => [...prev, city]);
  const handleDeleteCity = (city: string) => setCities(prev => prev.filter(c => c !== city));
  const handleAddDeal = (deal: Omit<Deal, 'id'>) => setDeals(prev => [{...deal, id: `d-${Date.now()}`}, ...prev]);
  const handleDeleteDeal = (id: string) => setDeals(prev => prev.filter(d => d.id !== id));
  
  const handleAddRecommendation = (rec: Omit<Recommendation, 'id'|'upvotes'|'upvotedBy'|'timestamp' | 'status'>) => {
    const newRec: Recommendation = {...rec, id: `rec-${Date.now()}`, upvotes: 0, upvotedBy: [], timestamp: 'Just now', status: 'pending' };
    setRecommendations(prev => [newRec, ...prev]);
  };
  const handleApproveRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.map(r => r.id === recommendationId ? { ...r, status: 'approved' } : r));
  };
  const handleRejectRecommendation = (recommendationId: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== recommendationId));
  };
   const handleAdminAddRecommendation = (rec: Omit<Recommendation, 'id' | 'timestamp' | 'status'>) => {
    const newRec: Recommendation = {...rec, id: `rec-${Date.now()}`, timestamp: 'Just now', status: 'approved' };
    setRecommendations(prev => [newRec, ...prev]);
  };
  const handleUpdateRecommendation = (id: string, data: Partial<Omit<Recommendation, 'id'>>) => {
    setRecommendations(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };
  const handleDeleteRecommendation = (id: string) => setRecommendations(prev => prev.filter(r => r.id !== id));
  const handleUpvoteRecommendation = (recommendationId: string, userId: string) => {
    const rec = recommendations.find(r => r.id === recommendationId);
    if (rec) {
      logAnalyticsEvent({
        type: 'recommendation_upvote',
        payload: { recommendationId: rec.id, recommendationSubcategory: rec.subcategory }
      });
    }

    setRecommendations(prev => prev.map(r => {
        if (r.id === recommendationId) {
            const hasUpvoted = r.upvotedBy.includes(userId);
            return {
                ...r,
                upvotes: hasUpvoted ? r.upvotes - 1 : r.upvotes + 1,
                upvotedBy: hasUpvoted ? r.upvotedBy.filter(uid => uid !== userId) : [...r.upvotedBy, userId]
            };
        }
        return r;
    }));
  };
  
  const handleDealClick = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      logAnalyticsEvent({
        type: 'deal_click',
        payload: { dealId: deal.id, dealCategory: deal.category }
      });
    }
  };
  
  const handleRecClick = (recommendationId: string) => {
    logAnalyticsEvent({
      type: 'recommendation_click',
      payload: { recommendationId }
    });
  };

  const handleAddTrip = (trip: Omit<Trip, 'id' | 'status' | 'waitlist' | 'participants'>) => {
    const newTrip: Trip = { ...trip, id: `t-${Date.now()}`, status: TripStatus.PENDING, waitlist: [], participants: [] };
    setTrips(prev => [newTrip, ...prev]);
  };
  const handleJoinWaitlist = (tripId: string, user: User) => {
    setTrips(prev => prev.map(t => t.id === tripId ? {...t, waitlist: [...t.waitlist, { id: user.id, username: user.username, contactNumber: user.contactNumber }]} : t));
  };
  const handleJoinLiveTrip = (tripId: string, user: User) => {
    setTrips(prev => prev.map(t => t.id === tripId ? {...t, participants: [...t.participants, { id: user.id, username: user.username, contactNumber: user.contactNumber }]} : t));
  };
  const handleApproveTrip = async (id: string) => {
    setApprovingTripId(id);
    const trip = trips.find(t => t.id === id);
    if (!trip) { setApprovingTripId(null); return; }
    try {
      const itinerary = await generateTripItinerary(trip.destination, 'one week', 'budget-friendly and social');
      setTrips(prev => prev.map(t => t.id === id ? { ...t, status: TripStatus.APPROVED, itinerary } : t));
    } catch(error) {
       console.error(error);
       alert((error as Error).message);
       setTrips(prev => prev.map(t => t.id === id ? { ...t, status: TripStatus.APPROVED, itinerary: 'AI itinerary generation failed. Please add one manually.' } : t));
    } finally {
        setApprovingTripId(null);
    }
  };
  const handleRejectTrip = (id: string) => setTrips(prev => prev.map(t => t.id === id ? { ...t, status: TripStatus.REJECTED } : t));
  const handleStartTripRecruitment = (id: string) => setTrips(prev => prev.map(t => t.id === id ? { ...t, status: TripStatus.RECRUITING } : t));
  const handleUpdateTripCapacity = (tripId: string, newCapacity: number) => setTrips(prev => prev.map(t => t.id === tripId ? { ...t, maxParticipants: newCapacity } : t));
  const handleAddUserToTrip = (tripId: string, user: User) => {
    setTrips(prev => prev.map(t => {
      if (t.id === tripId) {
        const newParticipant: TripParticipant = { id: user.id, username: user.username, contactNumber: user.contactNumber };
        return { ...t, participants: [...t.participants, newParticipant], waitlist: t.waitlist.filter(p => p.id !== user.id) };
      }
      return t;
    }));
  };
  const handleRemoveUserFromTrip = (tripId: string, userId: string) => setTrips(prev => prev.map(t => t.id === tripId ? { ...t, participants: t.participants.filter(p => p.id !== userId) } : t));
  const handleAddUserToWaitlist = (tripId: string, user: User) => handleJoinWaitlist(tripId, user);
  const handleRemoveUserFromWaitlist = (tripId: string, userId: string) => setTrips(prev => prev.map(t => t.id === tripId ? { ...t, waitlist: t.waitlist.filter(p => p.id !== userId) } : t));

  const handleAddPost = (topicId: string, post: { author: string; userId: string; message: string; }) => {
    const newPost: ForumPost = { ...post, id: `p-${Date.now()}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), upvotes: 0, downvotes: 0, upvotedBy: [], downvotedBy: [], reportedBy: [] };
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, posts: [...t.posts, newPost] } : t));
  };
  const handleAddTopic = (topic: Omit<ForumTopic, 'id' | 'posts' | 'upvotes' | 'downvotes' | 'upvotedBy' | 'downvotedBy' | 'timestamp' | 'reportedBy'>) => {
    const newTopic: ForumTopic = { ...topic, id: `ft-${Date.now()}`, posts: [], upvotes: 1, downvotes: 0, upvotedBy: [topic.userId], downvotedBy: [], timestamp: 'Just now', reportedBy: [] };
    setTopics(prev => [newTopic, ...prev]);
  };
  const handleDeletePost = (topicId: string, postId: string) => setTopics(prev => prev.map(t => t.id === topicId ? { ...t, posts: t.posts.filter(p => p.id !== postId) } : t));
  const handleDeleteTopic = (topicId: string) => setTopics(prev => prev.filter(t => t.id !== topicId));

  const handleVote = (
    currentVotes: number, hasVoted: boolean, otherHasVoted: boolean,
    votedBy: string[], otherVotedBy: string[], userId: string
  ) => {
    let newVotes = currentVotes;
    let newVotedBy = [...votedBy];
    let otherNewVotes = 0; // Temp value, will be calculated from otherHasVoted
    let otherNewVotedBy = [...otherVotedBy];

    if (hasVoted) {
      newVotes--;
      newVotedBy = newVotedBy.filter(id => id !== userId);
    } else {
      newVotes++;
      newVotedBy.push(userId);
      if (otherHasVoted) {
        otherNewVotedBy = otherNewVotedBy.filter(id => id !== userId);
      }
    }
    return { newVotes, newVotedBy, otherNewVotedBy };
  };

  const handleVoteTopic = (topicId: string, userId: string, voteType: 'up' | 'down') => {
    setTopics(prev => prev.map(t => {
        if (t.id === topicId) {
            const hasUpvoted = t.upvotedBy.includes(userId);
            const hasDownvoted = t.downvotedBy.includes(userId);

            let newUpvotes = t.upvotes;
            let newDownvotes = t.downvotes;
            let newUpvotedBy = [...t.upvotedBy];
            let newDownvotedBy = [...t.downvotedBy];

            if (voteType === 'up') {
                if (hasUpvoted) {
                    newUpvotes--;
                    newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                } else {
                    newUpvotes++;
                    newUpvotedBy.push(userId);
                    if (hasDownvoted) {
                        newDownvotes--;
                        newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                    }
                }
            } else { // voteType === 'down'
                if (hasDownvoted) {
                    newDownvotes--;
                    newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                } else {
                    newDownvotes++;
                    newDownvotedBy.push(userId);
                    if (hasUpvoted) {
                        newUpvotes--;
                        newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                    }
                }
            }
            return { ...t, upvotes: newUpvotes, downvotes: newDownvotes, upvotedBy: newUpvotedBy, downvotedBy: newDownvotedBy };
        }
        return t;
    }));
  };

  const handleVotePost = (topicId: string, postId: string, userId: string, voteType: 'up' | 'down') => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        const newPosts = t.posts.map(p => {
          if (p.id === postId) {
            const hasUpvoted = p.upvotedBy.includes(userId);
            const hasDownvoted = p.downvotedBy.includes(userId);
            let newUpvotes = p.upvotes;
            let newDownvotes = p.downvotes;
            let newUpvotedBy = [...p.upvotedBy];
            let newDownvotedBy = [...p.downvotedBy];

             if (voteType === 'up') {
                if (hasUpvoted) {
                    newUpvotes--;
                    newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                } else {
                    newUpvotes++;
                    newUpvotedBy.push(userId);
                    if (hasDownvoted) {
                        newDownvotes--;
                        newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                    }
                }
            } else { // voteType === 'down'
                if (hasDownvoted) {
                    newDownvotes--;
                    newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                } else {
                    newDownvotes++;
                    newDownvotedBy.push(userId);
                    if (hasUpvoted) {
                        newUpvotes--;
                        newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                    }
                }
            }
            return { ...p, upvotes: newUpvotes, downvotes: newDownvotes, upvotedBy: newUpvotedBy, downvotedBy: newDownvotedBy };
          }
          return p;
        });
        return { ...t, posts: newPosts };
      }
      return t;
    }));
  };
  
  const handleReportTopic = (topicId: string, userId: string) => {
    setTopics(prev => prev.map(t =>
      t.id === topicId && !t.reportedBy.includes(userId)
        ? { ...t, reportedBy: [...t.reportedBy, userId] }
        : t
    ));
  };
  
  const handleReportPost = (topicId: string, postId: string, userId: string) => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        const newPosts = t.posts.map(p =>
          p.id === postId && !p.reportedBy.includes(userId)
            ? { ...p, reportedBy: [...p.reportedBy, userId] }
            : p
        );
        return { ...t, posts: newPosts };
      }
      return t;
    }));
  };

  const handleSendChatbotMessage = async (message: string) => {
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatbotMessages(prev => [...prev, userMessage, { role: 'loading', content: '' }]);
    setIsChatbotLoading(true);

    try {
        const botResponse = await getChatbotResponse(message, { deals, recommendations, trips });
        const botMessage: ChatMessage = { role: 'bot', content: botResponse };
        setChatbotMessages(prev => [...prev.slice(0, -1), botMessage]); // Replace loading with response
    } catch (error) {
        const errorMessage: ChatMessage = { role: 'bot', content: (error as Error).message };
        setChatbotMessages(prev => [...prev.slice(0, -1), errorMessage]); // Replace loading with error
    } finally {
        setIsChatbotLoading(false);
    }
  };

  // Marketplace Handlers
  const handleAddMarketplaceItem = (item: Omit<MarketplaceItem, 'id' | 'status' | 'negotiations'>) => {
    const newItem: MarketplaceItem = {
      ...item,
      id: `mkt-${Date.now()}`,
      status: 'pending',
      negotiations: [],
    };
    setMarketplaceItems(prev => [newItem, ...prev]);
  };

  const handleApproveMarketplaceItem = (itemId: string) => {
    setMarketplaceItems(prev => prev.map(item => (item.id === itemId ? { ...item, status: 'approved' } : item)));
  };

  const handleRejectMarketplaceItem = (itemId: string) => {
    setMarketplaceItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleBuyItem = (itemId: string, buyerInfo: { name: string; phone: string; email: string }) => {
    setMarketplaceItems(prev => prev.map(item => (item.id === itemId ? { ...item, status: 'sold', buyerInfo } : item)));
  };

  const handleNegotiate = (itemId: string, offer: Omit<Negotiation, 'id' | 'status' | 'timestamp'>) => {
    setMarketplaceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newNegotiation: Negotiation = {
          ...offer,
          id: `neg-${Date.now()}`,
          status: 'pending',
          timestamp: 'Just now',
        };
        // Remove previous pending offers from the same buyer
        const otherNegotiations = item.negotiations.filter(n => !(n.buyerId === offer.buyerId && n.status === 'pending'));
        return { ...item, negotiations: [...otherNegotiations, newNegotiation] };
      }
      return item;
    }));
  };

  const handleRespondToNegotiation = (itemId: string, negotiationId: string, response: 'accepted' | 'rejected') => {
    setMarketplaceItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const negotiation = item.negotiations.find(n => n.id === negotiationId);
        if (!negotiation) return item;

        if (response === 'accepted') {
          // Accept this one, reject all others that are pending
          const updatedNegotiations = item.negotiations.map((n): Negotiation => {
            if (n.id === negotiationId) return { ...n, status: 'accepted' };
            if (n.status === 'pending') return { ...n, status: 'rejected' };
            return n;
          });
          return { ...item, price: negotiation.offerPrice, negotiations: updatedNegotiations };
        } else { // rejected
          const updatedNegotiations = item.negotiations.map((n): Negotiation =>
            n.id === negotiationId ? { ...n, status: 'rejected' } : n
          );
          return { ...item, negotiations: updatedNegotiations };
        }
      }
      return item;
    }));
  };

  const isAdmin = currentUser?.role === 'admin';
  
  const renderPage = () => {
    switch (currentPage) {
      case 'deals':
        return <DealsPage deals={deals} dealCategories={dealCategories} currentUser={currentUser} onLoginClick={() => setAuthModalOpen(true)} onDealClick={handleDealClick} />;
      case 'recommendations':
        return <RecommendationsPage recommendations={recommendations} cities={cities} subcategories={subcategories} currentUser={currentUser} onLoginClick={() => setAuthModalOpen(true)} onAddRecommendation={handleAddRecommendation} onUpvoteRecommendation={handleUpvoteRecommendation} onRecClick={handleRecClick} />;
      case 'travel':
        return <TravelPage trips={trips} onAddTrip={handleAddTrip} currentUser={currentUser} onJoinWaitlist={handleJoinWaitlist} onJoinLiveTrip={handleJoinLiveTrip} onLoginClick={() => setAuthModalOpen(true)} />;
      case 'forum':
        return <ForumPage 
          topics={topics} 
          onAddPost={handleAddPost} 
          onAddTopic={handleAddTopic} 
          currentUser={currentUser} 
          onLoginClick={() => setAuthModalOpen(true)} 
          onVoteTopic={handleVoteTopic}
          onVotePost={handleVotePost}
          onReportTopic={handleReportTopic}
          onReportPost={handleReportPost}
        />;
      case 'marketplace':
        return <MarketplacePage
          items={marketplaceItems}
          currentUser={currentUser}
          onListItem={handleAddMarketplaceItem}
          onFinalizeTransaction={handleBuyItem} // Handles both buy and rent
          onNegotiate={handleNegotiate}
          onRespondToNegotiation={handleRespondToNegotiation}
          onLoginClick={() => setAuthModalOpen(true)}
          cities={cities}
        />;
      default:
        return <DealsPage deals={deals} dealCategories={dealCategories} currentUser={currentUser} onLoginClick={() => setAuthModalOpen(true)} onDealClick={handleDealClick} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        currentPage={currentPage}
        setCurrentPage={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        onLoginClick={() => setAuthModalOpen(true)}
        isAdmin={isAdmin}
        isAdminView={isAdminView}
        onToggleAdminView={handleToggleAdminView}
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {isAdmin && isAdminView ? (
          <AdminPage
            users={users}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            analyticsEvents={analyticsEvents}
            deals={deals} onAddDeal={handleAddDeal} onDeleteDeal={handleDeleteDeal}
            recommendations={recommendations} onAdminAddRecommendation={handleAdminAddRecommendation} onUpdateRecommendation={handleUpdateRecommendation} onDeleteRecommendation={handleDeleteRecommendation} onApproveRecommendation={handleApproveRecommendation} onRejectRecommendation={handleRejectRecommendation}
            trips={trips} approvingTripId={approvingTripId} onApproveTrip={handleApproveTrip} onRejectTrip={handleRejectTrip} onStartTripRecruitment={handleStartTripRecruitment} onUpdateTripCapacity={handleUpdateTripCapacity} onAddUserToTrip={handleAddUserToTrip} onRemoveUserFromTrip={handleRemoveUserFromTrip} onAddUserToWaitlist={handleAddUserToWaitlist} onRemoveUserFromWaitlist={handleRemoveUserFromWaitlist}
            topics={topics} onDeletePost={handleDeletePost} onDeleteTopic={handleDeleteTopic}
            dealCategories={dealCategories} onAddDealCategory={handleAddDealCategory} onDeleteDealCategory={handleDeleteDealCategory}
            subcategories={subcategories} onAddSubcategory={handleAddSubcategory} onDeleteSubcategory={handleDeleteSubcategory}
            cities={cities} onAddCity={handleAddCity} onDeleteCity={handleDeleteCity}
            currentUser={currentUser}
            onLogout={handleLogout}
            marketplaceItems={marketplaceItems}
            onApproveMarketplaceItem={handleApproveMarketplaceItem}
            onRejectMarketplaceItem={handleRejectMarketplaceItem}
          />
        ) : renderPage()}
      </main>
      
      <Footer />

      {/* --- CHATBOT COMPONENTS --- */}
      {currentUser && currentUser.status === 'approved' && !isAdminView && (
          <>
              <Chatbot 
                  isOpen={isChatbotOpen}
                  onClose={() => setIsChatbotOpen(false)}
                  messages={chatbotMessages}
                  onSendMessage={handleSendChatbotMessage}
                  isLoading={isChatbotLoading}
              />
              <button
                  onClick={() => setIsChatbotOpen(prev => !prev)}
                  className="fixed bottom-6 right-4 sm:right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center animate-bounce-in"
                  aria-label="Toggle Chatbot"
              >
                   <div className={`transition-opacity duration-300 absolute ${isChatbotOpen ? 'opacity-0' : 'opacity-100'}`}>
                      <ChatbotIcon className="w-8 h-8"/>
                  </div>
                  <div className={`transition-opacity duration-300 absolute ${isChatbotOpen ? 'opacity-100' : 'opacity-0'}`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
              </button>
          </>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
    </div>
  );
};

export default App;