export interface YouTubeThumbnail {
  url: string;
  width?: number;
  height?: number;
}

export interface YouTubeVideoItem {
  id: {
    kind?: string;
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    channelId?: string;
    channelLogo?: string;
    description?: string;
    publishedAt?: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium: YouTubeThumbnail;
      high?: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
  };
  duration?: string;
  views?: string;
  category?: string;
  channelLogo?: string;
  subscriberCount?: string;
  likeCount?: string;
  likesCountNum?: number;
  isVerified?: boolean;
  badge?: string;
  uploadedTime?: string;
}

export const DEFAULT_TOPICS = [
  "All",
  "Gaming",
  "Music",
  "APIs",
  "Operating systems",
  "AI",
  "Podcasts",
  "Graphic design",
  "Mixes",
  "Adobe After Effects",
  "Portable computers",
  "Live",
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind",
  "Full Stack",
];



export const MOCK_CHANNEL_LOGOS: Record<string, string> = {
  "Manguman":
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=88&auto=format&fit=crop&q=80",
  "8DRhythm Official":
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=88&auto=format&fit=crop&q=80",
  "Tech Fire":
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=88&auto=format&fit=crop&q=80",
  "Programming with Mosh":
    "https://yt3.ggpht.com/HCv0fXFEEcD0HRyF0_qR1K7b7qO3KCzmIoyH1DEJYB94CIUFhIE5i2t2IDIPX97W1-DK4hegww=s88-c-k-c0xffffffff-no-rj-mo",
  "freeCodeCamp.org":
    "https://yt3.ggpht.com/ytc/AIdro_lGRc-05M2OoE1ejQdxeFhyP7OkJg9h4Y-7CK_5je3QqFI=s88-c-k-c0xffffffff-no-rj-mo",
  "Fireship":
    "https://yt3.ggpht.com/3fPNbkf_xPyCleq77ZhcxyeorY97NtMHVNUbaAON_RBDH9ydL4hJkjxC8x_4mpuopkB8oI7Ct6Y=s88-c-k-c0xffffffff-no-rj-mo",
  "Traversy Media":
    "https://yt3.ggpht.com/ytc/AIdro_mLysKc36lc_FVk2j777olWvLOjgDz6NCNGdiQBnAKRENM=s88-c-k-c0xffffffff-no-rj-mo",
  "3Blue1Brown":
    "https://yt3.ggpht.com/ytc/AIdro_nFzZFPLxPZRHcE3SSwzdrbuWqfoWYwLAu0_2iO6blQYAU=s88-c-k-c0xffffffff-no-rj-mo",
  "Theo - t3.gg":
    "https://yt3.ggpht.com/Y6jut5A-dhWRlv7W81kGxVFPtZGjZN97IhBP75uLnx2AVV7ZEJUUUxBKHlFw9GcwILxkz1E_cLc=s88-c-k-c0xffffffff-no-rj-mo",
  "Jack Herrington":
    "https://yt3.ggpht.com/ytc/AIdro_kGCkFeDznNTPpHJCV01GxQVeJQ4HYIYgDSyzQPJue8q2s=s88-c-k-c0xffffffff-no-rj-mo",
  "Web Dev Simplified":
    "https://yt3.ggpht.com/ytc/AIdro_nO3F7DfVXaf6wsHPS_hF327ggeWUCwZSELb5DCWBL1aw=s88-c-k-c0xffffffff-no-rj-mo",
  "Kevin Powell":
    "https://yt3.ggpht.com/gABekKWtQFmLIjVuhKwoPfd9nIRxAPPhyymO3XaOCc9wko28S9R_8CO125NFjZToZuLlSyfdrak=s88-c-k-c0xffffffff-no-rj-mo",
  "Andrej Karpathy":
    "https://yt3.ggpht.com/ytc/AIdro_nDvyq2NoPL626bk1IbxQ94SfQsD-B0qgZchghtQNkLWoEz=s88-c-k-c0xffffffff-no-rj-mo",
  "Rockstar Games":
    "https://yt3.ggpht.com/f0PgbUq0tAdrt_rQxprZdPfgg96y54Ge-LCagXvPzc6gnMiw42w-J-wAZ2n-TfXgB3ASkxk2=s88-c-k-c0x00ffffff-no-rj",
  "OliviaRodrigoVEVO":
    "https://yt3.ggpht.com/41-4WZupE4yY88igineZefzBZ3ud2nrtlBMv61OBWOfOcATol8PhmI5OZ0fLlrTszyZ3Ul9I9sE=s88-c-k-c0x00ffffff-no-rj",
};

export const RAW_MOCK_VIDEOS: YouTubeVideoItem[] = [
  // 1. Exact Video 1 from Screenshot
  {
    id: { videoId: "SDhN1MoUsM0" },
    snippet: {
      title: "APK Modding Full Course",
      channelTitle: "Manguman",
      description: "APK Modding Full Course - Beginners to Advanced reverse engineering, modding, and app security.",
      publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/SDhN1MoUsM0/hqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/SDhN1MoUsM0/maxresdefault.jpg" },
      },
    },
    duration: "12:00:01",
    views: "514K views",
    uploadedTime: "6 days ago",
    badge: "#55 hyped",
    category: "Operating systems",
  },
  // 2. Exact Video 2 from Screenshot
  {
    id: { videoId: "pin76PFJvAY" },
    snippet: {
      title: "8D Audio - KALYANI (with Shreya Ghoshal) ARJN | KDS | FIFTY4 | RON...",
      channelTitle: "8DRhythm Official",
      description: "8D Audio immersive surround sound experience. Put on your headphones and feel the music around you.",
      publishedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/pin76PFJvAY/hqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/pin76PFJvAY/maxresdefault.jpg" },
      },
    },
    duration: "4:35",
    views: "9.3M views",
    uploadedTime: "3 mo ago",
    category: "Music",
  },
  // 3. Exact Video 3 from Screenshot
  {
    id: { videoId: "2uiGxTj6QME" },
    snippet: {
      title: "Free Business Email With Your Own Domain in 8 Minutes No Zoho, No Pa...",
      channelTitle: "Tech Fire",
      description: "Set up 100% Free custom business email with your custom domain name in 8 minutes without paid plans.",
      publishedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/2uiGxTj6QME/hqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/2uiGxTj6QME/maxresdefault.jpg" },
      },
    },
    duration: "8:26",
    views: "1.1M views",
    uploadedTime: "6 mo ago",
    isVerified: true,
    category: "APIs",
  },
  {
    id: { videoId: "SqcY0GlETPk" },
    snippet: {
      title: "React Tutorial for Beginners - Full Practical Course [2024/2025]",
      channelTitle: "Programming with Mosh",
      description:
        "React JS Tutorial for Beginners - Learn React 18 with TypeScript and modern best practices from scratch.",
      publishedAt: "2024-03-12T14:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/SqcY0GlETPk/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg" },
      },
    },
    duration: "1:20:45",
    views: "2.4M views",
    category: "React",
  },
  {
    id: { videoId: "843nec-IvW0" },
    snippet: {
      title: "Next.js Full Course - Build and Deploy Modern Full-Stack Web Apps",
      channelTitle: "freeCodeCamp.org",
      description:
        "Master modern Next.js with App Router, Server Actions, Server Components, and Tailwind CSS.",
      publishedAt: "2024-06-18T16:30:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/843nec-IvW0/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/843nec-IvW0/hqdefault.jpg" },
      },
    },
    duration: "5:42:10",
    views: "1.1M views",
    category: "Next.js",
  },
  {
    id: { videoId: "d56mG7DezGs" },
    snippet: {
      title: "TypeScript Tutorial for Beginners - Learn TypeScript in 1 Hour",
      channelTitle: "Programming with Mosh",
      description:
        "TypeScript Tutorial for Beginners: Learn TypeScript basics, types, interfaces, generics and compile configs.",
      publishedAt: "2024-02-10T11:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/d56mG7DezGs/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/d56mG7DezGs/hqdefault.jpg" },
      },
    },
    duration: "48:15",
    views: "890K views",
    category: "TypeScript",
  },
  {
    id: { videoId: "mr15Xzb1Ook" },
    snippet: {
      title: "Tailwind CSS Full Course - Build Modern Responsive Websites",
      channelTitle: "freeCodeCamp.org",
      description:
        "Learn Tailwind CSS from fundamental utility classes to advanced grid layouts and dynamic dark mode themes.",
      publishedAt: "2024-04-05T09:15:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/mr15Xzb1Ook/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/mr15Xzb1Ook/hqdefault.jpg" },
      },
    },
    duration: "3:14:22",
    views: "720K views",
    category: "Tailwind",
  },
  {
    id: { videoId: "w7ejDZ8SWv8" },
    snippet: {
      title: "React in 100 Seconds // Quick Architecture Guide",
      channelTitle: "Fireship",
      description:
        "React explained in 100 seconds with modern hooks, state management, and virtual DOM concepts.",
      publishedAt: "2024-01-20T17:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/w7ejDZ8SWv8/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg" },
      },
    },
    duration: "2:24",
    views: "1.9M views",
    category: "React",
  },
  {
    id: { videoId: "ZVnjOPwW4ZA" },
    snippet: {
      title: "Next.js 15 Crash Course - Complete Tutorial for Beginners",
      channelTitle: "Traversy Media",
      description:
        "Learn Next.js 15 from scratch including Server Components, Server Actions, routing, and data fetching.",
      publishedAt: "2024-11-01T12:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/ZVnjOPwW4ZA/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/ZVnjOPwW4ZA/hqdefault.jpg" },
      },
    },
    duration: "1:15:30",
    views: "520K views",
    category: "Next.js",
  },
  {
    id: { videoId: "G3e-cpL7ofc" },
    snippet: {
      title: "Full Stack Web Development for Beginners 2025",
      channelTitle: "freeCodeCamp.org",
      description:
        "Learn full stack web development covering HTML, CSS, JavaScript, React, Node.js, and Cloud deployment.",
      publishedAt: "2024-07-28T18:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/G3e-cpL7ofc/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/G3e-cpL7ofc/hqdefault.jpg" },
      },
    },
    duration: "8:12:00",
    views: "3.5M views",
    category: "Full Stack",
  },
  {
    id: { videoId: "aircAruvnKk" },
    snippet: {
      title: "Neural Networks & Deep Learning Explained Beautifully",
      channelTitle: "3Blue1Brown",
      description:
        "What is a neural network, backpropagation, and how gradient descent actually works.",
      publishedAt: "2023-11-04T15:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg" },
      },
    },
    duration: "19:13",
    views: "15M views",
    category: "AI & ML",
  },
  {
    id: { videoId: "bMknfKXIFA8" },
    snippet: {
      title: "React Course - Beginner's Tutorial for React JavaScript Library",
      channelTitle: "freeCodeCamp.org",
      description:
        "Learn React by building interactive projects from scratch with modern functional components and state.",
      publishedAt: "2024-05-10T14:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/bMknfKXIFA8/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg" },
      },
    },
    duration: "11:55:27",
    views: "4.2M views",
    category: "React",
  },
  {
    id: { videoId: "mU6anWqZJcc" },
    snippet: {
      title: "Tailwind CSS in 100 Seconds // Rapid CSS Styling Guide",
      channelTitle: "Fireship",
      description:
        "A fast-paced review of Tailwind CSS utility classes, JIT compiler, and best practices.",
      publishedAt: "2023-08-14T15:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/mU6anWqZJcc/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/mU6anWqZJcc/hqdefault.jpg" },
      },
    },
    duration: "2:18",
    views: "1.4M views",
    category: "Tailwind",
  },
  {
    id: { videoId: "fBNz5xF-Kx4" },
    snippet: {
      title: "Node.js Full Tutorial for Beginners - Complete Backend Development",
      channelTitle: "Dave Gray",
      description:
        "Complete Node.js tutorial series covering file systems, event emitters, HTTP servers, Express, and MongoDB.",
      publishedAt: "2024-03-01T12:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/fBNz5xF-Kx4/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/fBNz5xF-Kx4/hqdefault.jpg" },
      },
    },
    duration: "6:58:30",
    views: "810K views",
    category: "Full Stack",
  },
  {
    id: { videoId: "zQnBQ4tB3ZA" },
    snippet: {
      title: "TypeScript in 100 Seconds // The Typed Superset of JS",
      channelTitle: "Fireship",
      description:
        "Learn what TypeScript brings to modern JavaScript development in 100 seconds.",
      publishedAt: "2023-05-12T16:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/zQnBQ4tB3ZA/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/zQnBQ4tB3ZA/hqdefault.jpg" },
      },
    },
    duration: "2:26",
    views: "1.6M views",
    category: "TypeScript",
  },
  {
    id: { videoId: "wm5gMKuwSYk" },
    snippet: {
      title: "Building Production Full Stack Next.js with Prisma and PostgreSQL",
      channelTitle: "freeCodeCamp.org",
      description:
        "End to end walkthrough building a scalable full-stack application with Next.js, Prisma ORM, and Postgres.",
      publishedAt: "2024-08-20T13:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/wm5gMKuwSYk/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/wm5gMKuwSYk/hqdefault.jpg" },
      },
    },
    duration: "44:12",
    views: "340K views",
    category: "Next.js",
  },
  {
    id: { videoId: "PkZNo7MFNFg" },
    snippet: {
      title: "Learn JavaScript - Full Course for Beginners",
      channelTitle: "freeCodeCamp.org",
      description:
        "This complete 134-part JavaScript tutorial for beginners will teach you everything you need to know to get started.",
      publishedAt: "2023-10-10T10:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/PkZNo7MFNFg/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg" },
      },
    },
    duration: "3:26:42",
    views: "12M views",
    category: "Full Stack",
  },
  {
    id: { videoId: "wjZofJX0v4M" },
    snippet: {
      title: "Docker in 100 Seconds // Containerization Demystified",
      channelTitle: "Fireship",
      description:
        "Docker explained in 100 seconds with real container architecture and workflow.",
      publishedAt: "2023-04-18T14:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/wjZofJX0v4M/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/wjZofJX0v4M/hqdefault.jpg" },
      },
    },
    duration: "2:25",
    views: "2.1M views",
    category: "AI & ML",
  },
  {
    id: { videoId: "iLWTnMzWtj4" },
    snippet: {
      title: "Git and GitHub for Beginners - Crash Course",
      channelTitle: "freeCodeCamp.org",
      description:
        "Learn how to use Git and GitHub to manage your code versions and collaborate on open source projects.",
      publishedAt: "2023-09-05T12:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/iLWTnMzWtj4/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/iLWTnMzWtj4/hqdefault.jpg" },
      },
    },
    duration: "1:08:40",
    views: "2.8M views",
    category: "Full Stack",
  },
  {
    id: { videoId: "e-ORhEE9VVg" },
    snippet: {
      title: "Clean Code - Uncle Bob / Lesson 1",
      channelTitle: "Clean Code",
      description:
        "Robert C Martin Uncle Bob teaches clean code principles, architecture patterns, and agile engineering practices.",
      publishedAt: "2022-04-11T12:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/e-ORhEE9VVg/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/e-ORhEE9VVg/hqdefault.jpg" },
      },
    },
    duration: "44:30",
    views: "1.8M views",
    category: "Full Stack",
  },
  {
    id: { videoId: "Ke90Tje7VS0" },
    snippet: {
      title: "React 19 Is Here - Every New Feature Explained",
      channelTitle: "Web Dev Simplified",
      description:
        "React 19 brings Action hooks, useOptimistic, useActionState, useFormStatus, and Server Components updates.",
      publishedAt: "2024-12-08T15:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/Ke90Tje7VS0/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/Ke90Tje7VS0/hqdefault.jpg" },
      },
    },
    duration: "16:45",
    views: "420K views",
    category: "React",
  },
  {
    id: { videoId: "c33AZBnRHks" },
    snippet: {
      title: "System Design Interview - An Insider's Guide",
      channelTitle: "ByteByteGo",
      description:
        "Scale from zero to millions of users with rate limiting, load balancing, caching, database sharding, and CDN.",
      publishedAt: "2023-07-15T13:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/c33AZBnRHks/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/c33AZBnRHks/hqdefault.jpg" },
      },
    },
    duration: "18:22",
    views: "3.1M views",
    category: "Full Stack",
  },
  {
    id: { videoId: "2OTq15xPuv0" },
    snippet: {
      title: "Modern CSS in 2025: Container Queries, Subgrid, and :has()",
      channelTitle: "Kevin Powell",
      description:
        "A comprehensive look at contemporary CSS features transforming web styling today.",
      publishedAt: "2024-09-12T16:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/2OTq15xPuv0/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/2OTq15xPuv0/hqdefault.jpg" },
      },
    },
    duration: "21:10",
    views: "680K views",
    category: "Tailwind",
  },
  {
    id: { videoId: "8mAITcNt710" },
    snippet: {
      title: "Machine Learning with Python: Zero to Hero Course",
      channelTitle: "freeCodeCamp.org",
      description:
        "Comprehensive beginner to intermediate tutorial covering NumPy, Pandas, Scikit-learn, and predictive modeling.",
      publishedAt: "2024-01-14T10:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/8mAITcNt710/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/8mAITcNt710/hqdefault.jpg" },
      },
    },
    duration: "9:52:14",
    views: "2.2M views",
    category: "AI & ML",
  },
  {
    id: { videoId: "T8TZQ6k4b7U" },
    snippet: {
      title: "Build and Deploy a Full Stack App in Next.js 15 & Supabase",
      channelTitle: "Sonny Sangha",
      description:
        "Build an ultra-modern SaaS web application using Next.js 15, Supabase authentication, PostgreSQL, and Stripe.",
      publishedAt: "2024-11-20T17:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/T8TZQ6k4b7U/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/T8TZQ6k4b7U/hqdefault.jpg" },
      },
    },
    duration: "4:18:05",
    views: "480K views",
    category: "Next.js",
  },
  {
    id: { videoId: "1wfZL-y24Qk" },
    snippet: {
      title: "Live Coding: Building a Realtime Chat Application with WebSockets",
      channelTitle: "The Primeagen",
      description:
        "Live broadcast building high-throughput socket communication, handling reconnection backoff and buffer flushing.",
      publishedAt: "2024-10-05T19:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/1wfZL-y24Qk/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/1wfZL-y24Qk/hqdefault.jpg" },
      },
    },
    duration: "2:45:10",
    views: "390K views",
    category: "Live",
  },
  {
    id: { videoId: "V_xro1bcAuA" },
    snippet: {
      title: "CSS Grid vs Flexbox - When to Use What?",
      channelTitle: "Fireship",
      description:
        "Break down the core mental models of 1D Flexbox vs 2D Grid layouts with intuitive practical demonstrations.",
      publishedAt: "2023-06-25T14:00:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/V_xro1bcAuA/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/V_xro1bcAuA/hqdefault.jpg" },
      },
    },
    duration: "6:14",
    views: "1.1M views",
    category: "Tailwind",
  },
  {
    id: { videoId: "x4rFhOi7Hp0" },
    snippet: {
      title: "Live Stream: Modern TypeScript Architectural Patterns & Generics",
      channelTitle: "Matt Pocock",
      description:
        "Deep dive into TypeScript conditional types, template literal types, mapped types, and inference techniques.",
      publishedAt: "2024-07-19T18:30:00Z",
      thumbnails: {
        medium: { url: "https://i.ytimg.com/vi/x4rFhOi7Hp0/mqdefault.jpg" },
        high: { url: "https://i.ytimg.com/vi/x4rFhOi7Hp0/hqdefault.jpg" },
      },
    },
    duration: "1:42:00",
    views: "210K views",
    category: "Live",
  },
];

export const MOCK_VIDEOS: YouTubeVideoItem[] = RAW_MOCK_VIDEOS.map((video) => {
  const logo = MOCK_CHANNEL_LOGOS[video.snippet.channelTitle];
  return {
    ...video,
    channelLogo: logo,
    snippet: {
      ...video.snippet,
      channelLogo: logo,
    },
  };
});

export function getAllTopics(): string[] {
  const dynamicCategories = Array.from(
    new Set(
      RAW_MOCK_VIDEOS.map((v) => v.category?.trim()).filter(
        (cat): cat is string => Boolean(cat && cat.toLowerCase() !== "all")
      )
    )
  );

  const set = new Set(DEFAULT_TOPICS);
  const topics = [...DEFAULT_TOPICS];

  for (const cat of dynamicCategories) {
    if (!set.has(cat)) {
      set.add(cat);
      topics.push(cat);
    }
  }

  return topics;
}
