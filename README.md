# Trello Clone

A personal project building a Trello-like task management system with Next.js 15.

## Features

**Core**
- Boards, Lists, and Cards with drag-and-drop
- Workspaces for organizing boards
- Board sharing with role-based access (Owner/Admin/Member)

**Cards**
- Rich text descriptions with TipTap editor
- Comments and activity timeline
- Labels, assignees, watchers
- Subtasks with progress tracking
- File attachments (images and links)
- Due dates with email reminders
- Cover images
- Complete/incomplete status

**Butler Automation**
- Rule-based automation (e.g., "when card added to list, then move card to the top of the list, and mark the card as complete")
- Scheduled automation (daily, weekly, custom intervals)
- Trigger conditions and actions

**Real-time**
- Live updates across users via Ably
- Instant board synchronization

## Tech Stack

**Frontend**
- Next.js 15 (App Router, Server Actions)
- React 19
- TailwindCSS + shadcn/ui
- TanStack Query
- Drag-and-drop: dnd-kit

**Backend**
- PostgreSQL + Prisma ORM
- Clerk Authentication
- Inngest (background jobs & automation)
- Resend (email)
- Ably (real-time)
- Firebase (file storage)

## Getting Started

1. Clone and install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
CLERK_SECRET_KEY="..."
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
RESEND_API_KEY="..."
ABLY_API_KEY="..."
FIREBASE_PROJECT_ID="..."
# ... and other Firebase credentials
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Run the dev server:
```bash
npm run dev
```

5. Run Inngest dev server (separate terminal):
```bash
npm run inngest
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev          # Start Next.js dev server
npm run inngest      # Start Inngest dev server
npm run build        # Build for production
npm run db           # Open Prisma Studio
npm run db:seed      # Seed the database
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## Project Structure

```
├── app/                 # Next.js app router
├── components/          # Shared React components
├── features/            # Feature modules (boards, cards, etc.)
├── lib/                 # Core utilities & configs
│   └── inngest/        # Background job functions
├── prisma/             # Database schema & migrations
├── services/           # External service integrations
└── shared/             # Shared types, utils, constants
```

## Notes

- Butler automation system inspired by Trello's Butler
- Email reminders sent via Inngest scheduled functions
- Real-time collaboration limited to board members
- File uploads stored in Firebase Storage
