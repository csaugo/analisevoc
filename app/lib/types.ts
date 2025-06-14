
export interface VoCAnalysis {
  id: string;
  companyId: string;
  company: {
    id: string;
    name: string;
  };
  totalTweets: number;
  positiveTweets: number;
  negativeTweets: number;
  neutralTweets: number;
  sentimentScore: number;
  engagementRate: number;
  reachEstimate: number;
  topTopics: string[];
  competitors: CompetitorData[];
  insights: string[];
  createdAt: string;
  tweets: TweetData[];
}

export interface TweetData {
  id: string;
  tweetId: string;
  content: string;
  author: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  likes: number;
  retweets: number;
  replies: number;
  createdAt: string;
}

export interface CompetitorData {
  name: string;
  sentimentScore: number;
  totalMentions: number;
  engagementRate: number;
}

export interface AnalysisRequest {
  companyName: string;
  platform: 'twitter' | 'reddit';
}

export interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  upvotes: number;
  downvotes: number;
  comments: number;
  created_at: string;
}

export interface PlatformData {
  id: string;
  content: string;
  author: string;
  likes: number;
  retweets: number;
  replies: number;
  created_at: string;
  platform?: 'twitter' | 'reddit';
  subreddit?: string; // Para posts do Reddit
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}
