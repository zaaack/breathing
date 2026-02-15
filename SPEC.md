# 478 Breathing Technique App Specification

## 1. Project Overview

**Project Name**: 478-breath
**Type**: Web Application (SPA)
**Core Functionality**: A guided breathing app implementing the 4-7-8 breathing technique with customizable timing, audio cues, and optional background music.
**Target Users**: Anyone seeking relaxation, stress relief, or sleep improvement through controlled breathing.

## 2. UI/UX Specification

### Layout Structure

- **Single Page Layout**: Centered content with breathing visualization
- **Header**: App title with settings toggle
- **Main Area**: 
  - Breathing circle animation (center)
  - Phase indicator text (Inhale/Hold/Exhale)
  - Timer display showing current phase countdown
  - Cycle counter
- **Controls**: Start/Pause/Reset buttons
- **Settings Panel**: Slide-out panel from right side

### Responsive Breakpoints
- Mobile: < 640px (full width, smaller circle)
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette**:
- Background: `#0a0a0f` (deep dark)
- Primary: `#6ee7b7` (mint green - inhale)
- Secondary: `#f472b6` (pink - hold)  
- Accent: `#60a5fa` (blue - exhale)
- Surface: `#1a1a24` (card background)
- Text Primary: `#f8fafc`
- Text Secondary: `#94a3b8`

**Typography**:
- Font Family: "Outfit" (Google Fonts) - modern, clean, calming
- Headings: 600 weight
- Body: 400 weight
- Phase Text: 48px (mobile: 32px)
- Timer: 72px (mobile: 56px)
- Buttons: 16px

**Spacing System**:
- Base unit: 4px
- Container padding: 24px
- Component gaps: 16px

**Visual Effects**:
- Breathing circle: Animated scale (1.0 → 1.5 for inhale, hold at 1.5, 1.5 → 1.0 for exhale)
- Smooth color transitions between phases
- Subtle glow effect on breathing circle
- Settings panel: slide-in animation (300ms ease-out)

### Components

1. **BreathingCircle**
   - Animated circular indicator
   - Gradient background based on phase
   - Scale animation synced with timer
   - States: idle, inhale, hold, exhale

2. **PhaseIndicator**
   - Large text showing current phase
   - Fade transition between phases

3. **TimerDisplay**
   - Countdown for current phase
   - Large, prominent numbers

4. **ControlButtons**
   - Start/Pause toggle button
   - Reset button
   - Icon + text labels

5. **SettingsPanel**
   - Inhale duration slider (2-10 seconds, default: 4)
   - Hold duration slider (2-10 seconds, default: 7)
   - Exhale duration slider (2-10 seconds, default: 8)
   - Total cycles input (1-20, default: 4)
   - Background music toggle + volume
   - Sound effects toggle

6. **BackgroundMusicPlayer**
   - Play/Pause control
   - Volume slider
   - Track selector (nature sounds, ambient)

## 3. Functionality Specification

### Core Features

1. **4-7-8 Breathing Timer**
   - Default: 4s inhale, 7s hold, 8s exhale
   - Customizable durations via settings
   - Continuous looping through cycles
   - Visual countdown for each phase

2. **Audio Prompts**
   - Inhale start: soft rising tone (sine wave, 220Hz → 440Hz, 500ms)
   - Hold start: steady tone (440Hz, 200ms)
   - Exhale start: soft falling tone (sine wave, 440Hz → 220Hz, 500ms)
   - Cycle complete: gentle chime
   - All generated via Web Audio API (no external files)

3. **Background Music**
   - Option to play ambient nature sounds
   - Implemented as synthesized audio (white noise filtered, brown noise)
   - Volume control (0-100%)
   - Plays continuously during session

4. **Settings Persistence**
   - All settings saved to localStorage via keyv-browser
   - Auto-load on app start
   - Settings: timing, volume, sound toggles

5. **Session Management**
   - Start/Pause functionality
   - Reset to beginning
   - Cycle counter display
   - Auto-stop after completing set cycles

### User Interactions

1. Click "Start" → Timer begins, first phase = Inhale
2. During breathing → Visual circle expands/contracts, phase text updates, countdown shows
3. Click "Pause" → Timer pauses, can resume
4. Click "Reset" → Returns to initial state
5. Click Settings icon → Settings panel slides in
6. Adjust sliders → Real-time preview, auto-saves

### Edge Cases

- Browser tab inactive: Timer continues (using setTimeout with drift correction)
- Audio context blocked: Show "Click to enable audio" prompt
- Settings changed mid-session: Apply on next cycle

## 4. Acceptance Criteria

### Visual Checkpoints
- [ ] Breathing circle animates smoothly between phases
- [ ] Colors change correctly for each phase (green/pink/blue)
- [ ] Phase text updates with correct label
- [ ] Timer countdown displays correctly
- [ ] Settings panel slides in/out smoothly
- [ ] Responsive on mobile devices

### Functional Checkpoints
- [ ] Timer progresses through Inhale → Hold → Exhale cycle
- [ ] Audio plays at each phase transition
- [ ] Background music plays when enabled
- [ ] Settings persist after page reload
- [ ] Start/Pause/Reset work correctly
- [ ] Cycle count increments properly

### Technical Checkpoints
- [ ] No console errors
- [ ] Build completes successfully
- [ ] TypeScript strict mode passes
