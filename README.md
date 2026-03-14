# The Shed

A focused practice environment for jazz improvisation.

## Core Objective

To build a single, open-source application that gives jazz musicians the essential tools they need to practise improvisation. It removes the friction of managing separate recording apps, backing tracks, and physical chord charts, allowing players to focus entirely on their instrument.

## Target Audience

Jazz instrumentalists focusing on improvisation, articulation, and phrasing. The app is specifically designed to accommodate horn players, handling the mental maths required for transposing instruments (such as converting a Concert C major chart into D major for a Bb trumpet).

## Technical Stack

The project uses a single-repository (monorepo) architecture, allowing seamless sharing of types and logic across the entire application.

- **Language:** TypeScript (used across both frontend and backend).
- **Frontend:** React.
- **Backend:** Node.js (using Express or Fastify).
- **Data Fetching:** TanStack Query.
- **Database & Storage:** Supabase (for user accounts, practice logs, and audio file storage).
- **Licence:** MIT.

## Core Features

- **Section Looper:** An audio player that lets users isolate and infinitely loop specific chord changes and turnarounds from backing tracks.
- **Transposition Engine:** A dynamic chart viewer that instantly transposes chord progressions.
- **Session Recorder:** A quick-capture audio recording tool. Users can instantly record and play back their solos to critique their own phrasing and study the stylistic nuances of players like Lee Morgan.
- **Practice Log:** A tracking system to monitor time spent in the shed. Users can log the specific standards they are working on, such as "Ceora", and review their historical progress.

## Repository Structure

- `/apps/web`: The React frontend application.
- `/apps/api`: The Node.js backend server.
- `/packages/shared`: Shared TypeScript types (e.g., `PracticeSession`, `ChordChart`) and music theory logic.
