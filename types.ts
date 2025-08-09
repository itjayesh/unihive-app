export interface Deal {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  link?: string;
  couponCode?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  author: string;
  userId: string;
  locationType: 'online' | 'physical';
  locationName?: string;
  subcategory: string;
  upvotes: number;
  upvotedBy: string[];
  timestamp: string;
  imageUrl?: string;
  link?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export enum TripStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved', // Waitlist Open
  RECRUITING = 'Recruiting', // Project is Live
  REJECTED = 'Rejected'
}

export interface TripParticipant {
  id: string; // user.id
  username: string;
  contactNumber: string;
}

export interface Trip {
  id: string;
  destination: string;
  proposer: string;
  description: string;
  waitlist: TripParticipant[];
  participants: TripParticipant[];
  maxParticipants: number;
  status: TripStatus;
  itinerary?: string;
}

export interface ForumPost { // This is now a comment
  id:string;
  author: string;
  userId: string;
  message: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  reportedBy: string[];
}

export interface ForumTopic { // This is now a post
  id: string;
  title: string;
  description: string; // This can be the body of the post
  posts: ForumPost[]; // These are the comments
  author: string;
  userId: string;
  timestamp: string;
  upvotes: number;
  downvotes: number;
  upvotedBy: string[];
  downvotedBy: string[];
  reportedBy: string[];
}

export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface User {
  id:string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  contactNumber: string;
  // New verification fields
  collegeName: string;
  verificationMethod: 'email' | 'id_card';
  idCardImageUrl?: string;
  status: UserStatus;
}


export interface AnalyticsEvent {
  type: 'deal_click' | 'recommendation_upvote' | 'session_duration' | 'recommendation_click';
  timestamp: number;
  userId: string;
  payload: {
    dealId?: string;
    dealCategory?: string;
    recommendationId?: string;
    recommendationSubcategory?: string;
    durationMs?: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'bot' | 'loading';
  content: string;
}

export interface Negotiation {
  id: string;
  buyerId: string;
  buyerName: string;
  offerPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
}

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  status: 'pending' | 'approved' | 'sold';
  negotiations: Negotiation[];
  buyerInfo?: {
    name: string;
    phone: string;
    email: string;
  };
  type: 'sell' | 'rent';
  sellerLocation: string;
  shippingAvailable: boolean;
  rentingPeriod?: 'day' | 'week' | 'month';
}

export type Page = 'deals' | 'recommendations' | 'travel' | 'forum' | 'marketplace';
export type AdminPageType = 'analytics' | 'users' | 'deals' | 'recommendations' | 'trips' | 'forum' | 'marketplace';