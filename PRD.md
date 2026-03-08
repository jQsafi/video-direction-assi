# Planning Guide

An intelligent video production assistant that guides users through the complete video creation process - from requirement gathering to script generation, and finally provides real-time camera direction guidance with visual positioning cues.

**Experience Qualities**:
1. **Guided** - The app walks users through each step methodically, never overwhelming them with choices
2. **Intelligent** - Uses AI to analyze inputs and generate contextual scripts and directions automatically
3. **Assistive** - Provides real-time visual feedback to help users position themselves correctly for perfect shots

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-stage application involving requirement collection, AI script generation, camera integration with real-time face detection, and visual guidance overlays - requiring sophisticated state management and multiple interconnected views.

## Essential Features

### Step-by-Step Requirement Collection
- **Functionality**: Multi-step form collecting video type, purpose, duration, tone, key points, and target audience
- **Purpose**: Gathers comprehensive context to generate relevant scripts and directions
- **Trigger**: User clicks "Start New Video Project" on home screen
- **Progression**: Welcome screen → Video type selection → Purpose input → Duration selection → Tone selection → Key points input → Target audience → Review & Submit
- **Success criteria**: All requirements stored in KV, user can navigate forward/backward, progress indicator shows current step

### AI Script & Direction Generation
- **Functionality**: Uses LLM to analyze requirements and generate shooting script with scene-by-scene directions
- **Purpose**: Provides users with professional-quality script and camera directions based on their needs
- **Trigger**: User submits completed requirements form
- **Progression**: Analyzing requirements → Generating script → Generating directions → Display results with edit capability
- **Success criteria**: Script includes dialogue/narration, directions include camera angles, positioning, and shot types

### Real-Time Camera Direction System
- **Functionality**: Opens camera feed with overlay guides showing where user should position face/body, with visual indicators for correct positioning
- **Purpose**: Helps users execute directions accurately without needing external help
- **Trigger**: User clicks "Start Recording" on a specific scene/direction
- **Progression**: Camera permission → Camera feed loads → Face detection activates → Visual guides appear → Position feedback (too close/far/left/right) → Record when positioned correctly
- **Success criteria**: Face detection works in real-time, visual guides overlay camera feed, color-coded feedback (red=wrong, green=correct), distance and angle measurements displayed

### Script & Direction Editor
- **Functionality**: Users can edit generated scripts and directions before filming
- **Purpose**: Allows customization and refinement of AI-generated content
- **Trigger**: User clicks "Edit" on script or direction card
- **Progression**: View mode → Edit mode → Make changes → Save → Return to view mode
- **Success criteria**: Changes persist, all text fields editable, regenerate option available

### Project Management
- **Functionality**: Save multiple video projects, view history, resume or delete projects
- **Purpose**: Enables users to work on multiple videos over time
- **Trigger**: User navigates to "My Projects" section
- **Progression**: View project list → Select project → Load requirements/script/directions → Continue from last step
- **Success criteria**: Projects persist in KV storage, show creation date, status, and project name

## Edge Case Handling

- **No Camera Access**: Display clear instructions for enabling camera permissions with fallback to upload mode
- **Face Not Detected**: Show helpful prompts to adjust lighting or position, offer manual override option
- **Empty Requirement Fields**: Validate required fields, provide helpful error messages, suggest defaults
- **Very Long Scripts**: Paginate or chunk into manageable scenes, provide scene navigation
- **Network/LLM Errors**: Retry mechanism, show user-friendly error messages, cache last successful generation
- **Multiple Faces Detected**: Highlight primary face, provide option to select which face to track
- **Browser Compatibility**: Detect feature support, show compatibility warnings for unsupported browsers

## Design Direction

The design should feel like a professional film production studio interface - authoritative and technical yet approachable. Evoke the feeling of having a personal film director and cinematographer guiding every step. Think high-contrast cinematic themes with director's viewfinder aesthetics, paired with warm encouraging guidance.

## Color Selection

A bold cinematic color palette inspired by professional film production with high contrast and dramatic accents.

- **Primary Color**: Deep cinematic slate blue `oklch(0.25 0.05 250)` - Commands authority and professionalism like a director's chair
- **Secondary Colors**: 
  - Charcoal backdrop `oklch(0.15 0.01 270)` for depth and focus
  - Warm studio light amber `oklch(0.75 0.12 75)` for highlighting and warmth
- **Accent Color**: Director's red `oklch(0.58 0.22 25)` - Eye-catching like a recording indicator, used for CTAs and active states
- **Foreground/Background Pairings**: 
  - Primary slate blue `oklch(0.25 0.05 250)`: White text `oklch(0.98 0 0)` - Ratio 8.9:1 ✓
  - Charcoal backdrop `oklch(0.15 0.01 270)`: Light gray text `oklch(0.92 0 0)` - Ratio 11.2:1 ✓
  - Accent red `oklch(0.58 0.22 25)`: White text `oklch(0.98 0 0)` - Ratio 4.6:1 ✓
  - Background `oklch(0.98 0 0)`: Foreground `oklch(0.12 0.01 270)` - Ratio 14.8:1 ✓

## Font Selection

Typography should feel technical and authoritative like production callsheets, while maintaining clarity for on-screen reading during filming.

- **Typographic Hierarchy**:
  - H1 (Project Title): Space Grotesk Bold/32px/tight letter spacing - commanding presence
  - H2 (Section Headers): Space Grotesk SemiBold/24px/normal spacing - clear hierarchy
  - H3 (Step Labels): Space Grotesk Medium/18px/normal spacing - organized structure
  - Body (Instructions/Scripts): Inter Regular/16px/1.6 line height - optimal readability
  - Caption (Status/Metadata): JetBrains Mono Regular/13px/tight - technical precision
  - Button Text: Space Grotesk Medium/15px/wide letter spacing - clear actionability

## Animations

Animations should feel like smooth camera movements - confident pans, steady zooms, and professional transitions that mirror cinematography. Step transitions slide like film rolling through a camera. Camera guidance overlays pulse gently to draw attention without distraction. Real-time positioning feedback animates smoothly with easing that feels mechanical yet organic, like a gimbal stabilizing. Success states get a satisfying "locked in" animation, while errors shake subtly like a focus miss.

## Component Selection

- **Components**:
  - `Card` with custom border styling for requirement forms, script displays, and direction cards
  - `Button` with variants for primary actions (Start, Record), secondary navigation (Next, Back), and destructive actions (Delete Project)
  - `Input` and `Textarea` for text collection in requirement forms
  - `Select` for dropdown choices (video type, tone, duration presets)
  - `Progress` indicator showing completion through requirement steps
  - `Tabs` for switching between Script view and Directions view
  - `Dialog` for confirmation prompts and edit modals
  - `Badge` for status indicators (Draft, Ready, Recording, Complete)
  - `Separator` for visual section breaks
  - `ScrollArea` for long scripts and direction lists
  - `Toast` (Sonner) for success/error notifications

- **Customizations**:
  - Custom camera overlay component with canvas-based face detection visualization
  - Custom positioning grid component showing rule-of-thirds and center markers
  - Custom direction card with visual angle/distance indicators
  - Custom step wizard component with branching logic
  - Real-time feedback indicators (distance meter, angle guide, framing preview)

- **States**:
  - Buttons: Solid primary for main actions, ghost for secondary, destructive red for delete, disabled state when requirements incomplete, loading spinner during AI generation
  - Inputs: Focus state with accent red ring, error state with red border and helper text, success state with green checkmark icon
  - Camera feed: Idle (neutral border), Detecting (yellow pulse), Positioned correctly (green border), Position incorrect (red border with directional arrows)

- **Icon Selection**:
  - `Camera` for recording/camera actions
  - `FilmStrip` for script sections
  - `Target` for positioning guidance
  - `ArrowRight/ArrowLeft` for navigation
  - `Check` for completed steps
  - `Warning` for errors/attention needed
  - `Eye` for preview mode
  - `Pencil` for edit actions
  - `Play/Pause/Stop` for recording controls
  - `Plus` for new project creation

- **Spacing**:
  - Section padding: `p-8` (32px) for major containers
  - Card internal padding: `p-6` (24px)
  - Form field gaps: `gap-4` (16px) between inputs
  - Step wizard gaps: `gap-6` (24px) between steps
  - Button groups: `gap-3` (12px)
  - Tight inline elements: `gap-2` (8px)

- **Mobile**:
  - Stack camera feed above directions on small screens
  - Convert multi-column forms to single column below 768px
  - Reduce header sizes: H1 to 24px, H2 to 20px
  - Make buttons full-width on mobile for easier tapping
  - Simplify camera overlay guides for smaller viewports
  - Collapsible script sections using accordion on mobile
  - Bottom sheet for direction details instead of side panel
