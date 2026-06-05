# 🗺️ Learning Roadmap — Personal Learning Tracker

A production-ready personal learning roadmap app with an interactive tree-style graph view, notes, resources, and progress tracking. Built with Next.js 14, ReactFlow, Tailwind CSS, and Firebase Firestore.

---

## ✨ Features

- **Password-protected** single-user login (session-based, no Firebase Auth needed)
- **Multiple Roadmaps** — create, rename, delete roadmaps
- **Topics** with custom colors and per-topic progress
- **Unlimited nested Sub-Topics** — infinite depth tree
- **Interactive graph canvas** (ReactFlow) similar to roadmap.sh
  - Expand/collapse nodes by clicking
  - Smooth dagre auto-layout
  - MiniMap + zoom controls
- **Notes panel** — click any node to open a rich notes editor
  - Auto-saves notes with debounce
  - Add/delete YouTube video links (with thumbnails)
  - Add/delete resource links
  - Mark topics/subtopics as completed
- **Progress tracking** — live percentage on every node, topic, and roadmap
- **Dark theme** with a polished editorial aesthetic

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Graph | ReactFlow + dagre layout |
| Styling | Tailwind CSS + custom CSS vars |
| Database | Firebase Firestore |
| Auth | Single password (env var) + sessionStorage |
| Deployment | Vercel |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd learning-roadmap
npm install
```

### 2. Set Up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g., `learning-roadmap`)
3. Click **"Build" → "Firestore Database"** → **"Create database"**
   - Choose **"Start in production mode"** (or test mode for development)
   - Select your region
4. Go to **Project Settings** (gear icon) → **"Your apps"**
5. Click the web icon (`</>`) to add a web app
6. Copy the Firebase config values

### 3. Configure Firestore Security Rules

In Firebase Console → Firestore → **Rules**, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow access with a valid app session
    // Since we use client-side password auth, restrict by limiting
    // to authenticated reads/writes only from your app
    match /roadmaps/{roadmapId} {
      allow read, write: if true; // Update this for production
    }
  }
}
```

> **For production**: Consider using Firebase Anonymous Auth + security rules, or keep access restricted to your IP using Firebase App Check.

### 4. Create Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:

```env
# Firebase (from Project Settings → Your Apps)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Your login password (choose something strong)
NEXT_PUBLIC_APP_PASSWORD=MySecurePassword123!
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your password.

---

## 🚢 Deploy to Vercel

### Option A: Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. Under **Environment Variables**, add all variables from `.env.local`
5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_APP_PASSWORD

# Deploy to production
vercel --prod
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Auth gate → Dashboard or Login
│   └── globals.css         # Global styles, CSS variables, animations
├── components/
│   ├── auth/
│   │   └── LoginPage.tsx   # Password login UI
│   └── roadmap/
│       ├── DashboardPage.tsx   # Main app shell
│       ├── Sidebar.tsx         # Roadmap & topic management
│       ├── RoadmapFlow.tsx     # ReactFlow canvas wrapper
│       ├── NodeTypes.tsx       # Custom node components
│       ├── NotesPanel.tsx      # Notes, resources, subtopics panel
│       └── graphLayout.ts      # Dagre layout engine
├── lib/
│   ├── firebase.ts         # Firebase initialization
│   ├── db.ts               # Firestore CRUD operations
│   ├── auth.tsx            # Auth context & hook
│   └── utils.ts            # Helper functions
└── types/
    └── index.ts            # TypeScript interfaces
```

---

## 🎮 Usage Guide

### Creating Your First Roadmap

1. Login with your password
2. Click **+** next to "Roadmaps" in the sidebar
3. Type a name (e.g., "Frontend Development") → Press Enter

### Adding Topics

1. With a roadmap selected, click **+** next to "Topics"
2. Choose a color from the color picker
3. Type topic name → Press Enter
4. Topics appear as nodes on the canvas

### Navigating the Graph

- **Click a topic node** → Expands its subtopics + opens notes panel
- **Click a subtopic node** → Expands children + opens notes panel
- **Scroll** to zoom, **drag canvas** to pan
- **MiniMap** (bottom-right) for overview

### Adding Sub-Topics

1. Click a topic node to open the notes panel
2. In the panel, click **+ Add** next to "Sub-topics"
3. Type name → Press Enter
4. To add nested subtopics, hover a subtopic row → click **+**

### Notes & Resources

In the notes panel (right side):
- **Notes**: Type freely, auto-saves after 1.5 seconds
- **YouTube**: Paste a YouTube URL, shows thumbnail preview
- **Links**: Add any reference URL
- **Mark complete**: Toggle completion badge on topics/subtopics

---

## 🔒 Security Notes

- The password is stored as an env variable prefixed `NEXT_PUBLIC_`, meaning it's bundled into the client JS. This is acceptable for a **personal single-user app** but not for multi-user production apps.
- For stronger security, move password validation to a Next.js API route and use HTTP-only cookies.
- Firestore rules should be tightened for production. Consider Firebase App Check.

---

## 🧩 Customization

### Changing the Password

Update `NEXT_PUBLIC_APP_PASSWORD` in your `.env.local` and Vercel environment variables.

### Adding More Topic Colors

Edit `TOPIC_COLORS` in `src/lib/utils.ts`.

### Adjusting the Graph Layout

Edit spacing constants in `src/components/roadmap/graphLayout.ts`:
```typescript
const H_SEP = 60   // Horizontal separation between ranks
const V_SEP = 24   // Vertical separation between nodes
```

---

## 📝 License

MIT — use freely for personal projects.
