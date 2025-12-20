# Google Analytics Setup Guide

This guide will help you set up Google Analytics 4 (GA4) for your Quantum Tic-Tac-Toe game.

## Step 1: Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Admin" (gear icon) in the bottom left
4. In the "Property" column, click "Create Property"
5. Fill in the property details:
   - Property name: "Quantum Tic-Tac-Toe" (or your preferred name)
   - Reporting time zone: Choose your timezone
   - Currency: Choose your currency
6. Click "Next" and fill in business information
7. Click "Create"

## Step 2: Get Your Measurement ID

1. After creating the property, you'll see a "Data Streams" section
2. Click "Add stream" → "Web"
3. Enter your website URL: `https://quantum-ttt.com`
4. Enter a stream name: "Quantum Tic-Tac-Toe Web"
5. Click "Create stream"
6. You'll see your **Measurement ID** (format: `G-XXXXXXXXXX`)
7. Copy this Measurement ID

## Step 3: Add Measurement ID to Your Project

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add the following line:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
   Replace `G-XXXXXXXXXX` with your actual Measurement ID

3. **Important**: Add `.env` to your `.gitignore` file to keep your Measurement ID private

## Step 4: Deploy

1. Build your project: `npm run build`
2. Deploy as usual
3. **For GitHub Pages or similar**: You'll need to set the environment variable in your deployment platform:
   - For GitHub Actions: Add it as a repository secret
   - For Vercel/Netlify: Add it in the environment variables section

## Step 5: Verify It's Working

1. Visit your deployed site: https://quantum-ttt.com
2. Play a game (make some moves, start a game, etc.)
3. Go back to Google Analytics
4. Click "Reports" → "Realtime"
5. You should see activity within a few seconds

## Tracked Events

The following events are automatically tracked:

- **game_start**: When a new game begins (includes mode and difficulty)
- **game_move**: Each move made in the game
- **cycle_created**: When a quantum cycle is created
- **cycle_resolved**: When a cycle is resolved
- **game_end**: When a game ends (win/loss/tie, move count)
- **tutorial_open**: When the tutorial/explain panel is opened
- **ai_assistant_open**: When the AI assistant is opened
- **ai_tip_used**: When a player uses an AI tip
- **undo_used**: When undo is used
- **mode_change**: When switching between two-player and vs-bot modes
- **difficulty_change**: When changing bot difficulty level

## Viewing Analytics Data

- **Realtime**: See live activity on your site
- **Events**: View all tracked events under "Events" in the left sidebar
- **User Acquisition**: See where your users are coming from
- **Engagement**: See how users interact with your game

## Troubleshooting

- **No data showing**: 
  - Make sure your `.env` file has the correct Measurement ID
  - Rebuild and redeploy your site
  - Check browser console for any errors
  - Verify the Measurement ID format is correct (starts with `G-`)

- **Events not tracking**:
  - Open browser DevTools → Console
  - Look for any errors related to `gtag` or analytics
  - Verify the environment variable is set correctly

## Privacy Note

This implementation uses Google Analytics 4, which respects user privacy settings. Users can opt out via browser extensions or settings.

