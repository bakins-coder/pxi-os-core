# Directive: Meeting Notes Integration for Nexus

**To**: Nexus (Systems Architect / Life Ops Lead)
**From**: Prof (Orchestrator)
**Priority**: HIGH
**Date**: 2026-04-06

## Context
The user has built a new meeting note-taking app as a React/Vite SPA with a Firebase backend and Gemini 3.1 AI integration. It currently runs entirely client-side in the browser, with Firestore as the data store and no public API or webhooks yet.

## Goals
- Enable Nexus to support meeting attendance via the user's AI note-taking app.
- Store meeting summaries and action items in Google Drive inside the Executive Assistant system.
- Prepare the system for future automation once the app gains a webhook or API endpoint.

## Deliverables

### 1. Meeting Notes Folder
- [ ] Create or verify the Google Drive folder: `Executive Assistant/Meeting Notes`
- [ ] Create a meeting notes registry file or summary index in Drive if one does not already exist.

### 2. Meeting Capture Process
- [ ] For each scheduled meeting on Google Calendar, record the event details and required attendees.
- [ ] When the user attends a meeting, coordinate with them to use the browser-based note-taking app during or immediately after the meeting.
- [ ] Store completed meeting summaries in `Executive Assistant/Meeting Notes/`.

### 3. Summary Format
- [ ] Ensure stored notes include:
  - Meeting title and date/time
  - Participants
  - Speaker labels (e.g. Speaker 1, Speaker 2)
  - Key decisions
  - Action items with owners
  - Timestamps where available

### 4. Browser Extension Development
- [ ] Assist with developing a Chrome extension that:
  - Detects active meetings on supported platforms
  - Triggers the note-taking app
  - Automatically saves completed summaries to Google Drive
  - Integrates with Nexus for automated processing

## Notes
- Because the app is currently closed client-side, Nexus cannot yet call it directly from the backend.
- For now, Nexus's role is to coordinate note capture and manage the meeting note artifacts in Drive, while preparing for direct integration later.

## Next Step
Report back to the Team's Inbox once the meeting notes folder and initial capture process are set up.
