# Draggable Notes

A real-time collaborative sticky notes application built with Next.js, Supabase, and Tailwind CSS. Create, edit, and share colorful sticky notes that sync instantly across all users.

## Features

- 🎨 **Colorful Notes**: Choose from 6 vibrant colors for your sticky notes
- 🖱️ **Drag & Drop**: Smooth dragging with touch support for mobile devices
- ✏️ **Real-time Editing**: Edit notes inline with instant synchronization
- 👥 **Live Collaboration**: See other users online and their changes in real-time
- 📱 **Mobile Responsive**: Optimized for both desktop and mobile devices
- 🔄 **Auto-save**: Changes are automatically saved as you type
- 🗑️ **Easy Management**: Delete individual notes or clear all at once

## Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd draggable-notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Netlify deploy

1. Connect the repo on Netlify: Add new site → Import from Git.
2. Set environment variables in Site settings → Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Ensure `netlify.toml` is present with `@netlify/plugin-nextjs`.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
