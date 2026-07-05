# Open Source Building Blocks Research

Last updated: 2026-07-05
Project: `Ricco im Haus / Comic Factory`

## Purpose

The goal is to avoid rebuilding every professional studio feature from scratch. This document lists existing open-source or source-available projects that can be used as building blocks, integration references or architectural inspiration for the future Studio Workspace.

Important: every dependency must be checked for license compatibility before production integration. Several professional pipeline tools use AGPL/GPL/LGPL or special commercial licenses.

## Integration levels

```text
A = can be integrated soon as an npm/library-level building block
B = should run as a separate service or adapter later
C = use as architecture inspiration only for now
D = not recommended for this project right now
```

## Best immediate candidates

### 1. React Flow / xyflow

Repository:

```text
https://github.com/xyflow/xyflow
```

What it is:

```text
Open-source React/Svelte libraries for node-based UIs and flowchart/workflow editors.
```

Potential use in Comic Factory:

- visual production workflow graph
- ComfyUI node mapping visualizer
- episode pipeline graph
- render dependency graph
- asset lifecycle graph

Integration level:

```text
A — very relevant, React-native, strong fit.
```

Risk:

```text
Low. Still needs careful UI design so the app does not become a messy node editor too early.
```

Recommendation:

```text
Use for Studio Workspace visual pipeline map after domain modules are stable.
```

### 2. FilePond

Repository:

```text
https://github.com/pqina/filepond
```

What it is:

```text
JavaScript file upload library with drag-and-drop/image-processing ecosystem.
```

Potential use in Comic Factory:

- replace basic Bulk Upload with professional upload UI
- file validation
- image previews
- file type restrictions
- upload queue UI

Integration level:

```text
A — useful for Asset Intake v1.
```

Risk:

```text
Low. Check maintained status and plugin choices.
```

Recommendation:

```text
Use when Asset Library gets real storage instead of localStorage-only uploads.
```

### 3. imgproxy

Repository:

```text
https://github.com/imgproxy/imgproxy
```

What it is:

```text
Standalone image resizing/processing/conversion server.
```

Potential use in Comic Factory:

- thumbnails
- webp/avif variants
- safe preview URLs
- crop/resize without regenerating assets
- asset gallery performance

Integration level:

```text
B — best as a separate image service later.
```

Risk:

```text
Medium. Requires real file storage and deployment.
```

Recommendation:

```text
Not needed while localStorage MVP is active. Strong candidate once Supabase/S3/MinIO storage exists.
```

### 4. Annotorious

Repository:

```text
https://github.com/annotorious/annotorious
```

What it is:

```text
Image annotation functionality for web pages.
```

Potential use in Comic Factory:

- draw review notes on generated panel images
- mark face drift
- mark bad hands/text artifacts
- indicate desired crop/bubble position

Integration level:

```text
A/B — promising for Review Room v1.
```

Risk:

```text
Medium. Need confirm current React support and maintenance before adopting.
```

Recommendation:

```text
Research deeper before integrating. Could be perfect for human QA annotations.
```

### 5. React Konva

Repository:

```text
https://github.com/konvajs/react-konva
```

What it is:

```text
React wrapper for drawing complex canvas graphics.
```

Potential use in Comic Factory:

- custom lettering editor
- speech bubble placement
- panel crop handles
- simple composition editor
- annotation overlays

Integration level:

```text
A — strong fit for our own lettering/editor canvas.
```

Risk:

```text
Low/medium. We must build the editor logic ourselves.
```

Recommendation:

```text
Better fit than a huge whiteboard if we want a focused comic page editor.
```

## Professional pipeline candidates

### 6. Kitsu

Repository:

```text
https://github.com/cgwire/kitsu
```

What it is:

```text
Collaboration platform for animation, VFX and video game productions.
```

Potential use in Comic Factory:

- production tracking model inspiration
- shot/task/status layout inspiration
- team workflow inspiration
- possible future external tracker integration

Integration level:

```text
C/B — do not embed now; study and maybe integrate through API later.
```

Risk:

```text
High for direct integration because it is a full platform and AGPL licensed.
```

Recommendation:

```text
Study its data model and workflow. Do not copy UI. Do not merge into current Vite app.
```

### 7. Zou

Repository:

```text
https://github.com/cgwire/zou
```

What it is:

```text
Kitsu API/backend for production data: projects, shots, assets, tasks, file metadata, previews, versions and event stream.
```

Potential use in Comic Factory:

- future backend alternative to our custom Supabase schema
- reference for production-data API design
- adapter inspiration for tasks/assets/shots

Integration level:

```text
C/B — useful model, not immediate dependency.
```

Risk:

```text
High. Full backend stack and AGPL. Could be too heavy.
```

Recommendation:

```text
Use as architecture reference. Our Supabase schema can borrow concepts without adopting the whole platform.
```

### 8. Prism Pipeline

Repository:

```text
https://github.com/PrismPipeline/Prism
```

What it is:

```text
Pipeline tool that automates and simplifies animation/VFX workflows.
```

Potential use in Comic Factory:

- folder structure inspiration
- DCC pipeline concepts
- publish/version workflow inspiration
- asset dependency thinking

Integration level:

```text
C — inspiration, not direct web-app dependency.
```

Risk:

```text
High for direct use. It is Python/DCC-oriented and license must be reviewed carefully.
```

Recommendation:

```text
Study its publish/version/workflow ideas. Do not integrate directly into the React MVP.
```

### 9. OpenCue

Repository:

```text
https://github.com/AcademySoftwareFoundation/OpenCue
```

What it is:

```text
Open-source render management system for VFX/animation productions.
```

Potential use in Comic Factory:

- future render queue/renderserver architecture
- render farm status inspiration
- scalable job dispatch inspiration

Integration level:

```text
C/B — only relevant later if we run many machines/jobs.
```

Risk:

```text
High for current solo workflow. Too much system for local MVP.
```

Recommendation:

```text
Do not integrate now. Keep current Generation Queue simple; revisit when batch/API rendering is proven.
```

### 10. OpenAssetIO

Repository:

```text
https://github.com/AcademySoftwareFoundation/OpenAssetIO
```

What it is:

```text
Asset-management interoperability layer from the Academy Software Foundation ecosystem.
```

Potential use in Comic Factory:

- future asset resolver concepts
- asset identity/URI abstraction
- tool interoperability model

Integration level:

```text
C — architecture reference for asset identity.
```

Risk:

```text
Medium/high. Likely overkill until we have a real asset library.
```

Recommendation:

```text
Study later when designing real asset IDs and storage abstraction.
```

## Canvas / whiteboard candidates

### 11. tldraw

Repository:

```text
https://github.com/tldraw/tldraw
```

What it is:

```text
React SDK for infinite canvas apps with drawing, diagramming, custom shapes, runtime API and collaboration features.
```

Potential use in Comic Factory:

- story wall
- beat board
- moodboard
- reference board
- collaborative art review

Integration level:

```text
B/C for us right now.
```

Risk:

```text
Production use requires license review/key. It may be too broad for focused comic tooling.
```

Recommendation:

```text
Do not integrate blindly. Useful if we want a Figma/Miro-like Story Wall later.
```

### 12. Excalidraw

Repository:

```text
https://github.com/excalidraw/excalidraw
```

What it is:

```text
Virtual whiteboard for sketching hand-drawn diagrams.
```

Potential use in Comic Factory:

- rough beat boards
- hand-drawn flow sketches
- planning canvas

Integration level:

```text
C — good inspiration, not core production dependency.
```

Risk:

```text
Low technically, but might distract from focused workflow.
```

Recommendation:

```text
Use only if a quick storyboard/moodboard canvas becomes necessary.
```

## Video / export candidates

### 13. Remotion

Repository:

```text
https://github.com/remotion-dev/remotion
```

What it is:

```text
Video creation with React; videos can be created programmatically, interactively or agentically.
```

Potential use in Comic Factory:

- animated comic exports
- dialogue/subtitle videos
- panel-to-video sequences
- social-safe trailers
- episode assembly

Integration level:

```text
B — strong future candidate after static comic page export works.
```

Risk:

```text
Medium. License has special commercial/company conditions; verify before serious use.
```

Recommendation:

```text
Do not use before PNG/PDF export is stable. Later: build Ricco episode video renderer.
```

### 14. ffmpeg.wasm

Repository:

```text
https://github.com/ffmpegwasm/ffmpeg.wasm
```

What it is:

```text
FFmpeg in the browser via WebAssembly.
```

Potential use in Comic Factory:

- local client-side video/audio conversions
- simple webm/mp4 experiments
- audio extraction
- prototype video packaging

Integration level:

```text
B — useful for browser-only experiments, not final render pipeline.
```

Risk:

```text
Medium. Browser performance and memory can hurt. Server-side ffmpeg may be better for final exports.
```

Recommendation:

```text
Use later only for lightweight local previews.
```

## Review / annotation candidates

### 15. Label Studio

Repository:

```text
https://github.com/HumanSignal/label-studio
```

What it is:

```text
Open-source data labeling tool for audio, text, images, videos and time series, with exports to model formats.
```

Potential use in Comic Factory:

- LoRA dataset curation
- image annotation
- reference approval experiments
- training-data pipeline

Integration level:

```text
B/C — separate service, not embedded page.
```

Risk:

```text
Medium/high. Full app stack. Could duplicate our Review Room.
```

Recommendation:

```text
Use as inspiration or external dataset tool when LoRA dataset curation begins.
```

### 16. CVAT

Repository:

```text
https://github.com/cvat-ai/cvat
```

What it is:

```text
Computer Vision Annotation Tool for image/video/3D annotation, QA, collaboration, analytics and APIs.
```

Potential use in Comic Factory:

- advanced annotation
- dataset QA
- bounding boxes/masks for ControlNet/segmentation later

Integration level:

```text
C/B — external tool only.
```

Risk:

```text
High for current MVP. Heavy and vision-dataset focused.
```

Recommendation:

```text
Not now. Revisit only when we need serious dataset/mask annotation.
```

## Render / AI workflow candidates

### 17. ComfyUI

Repository:

```text
https://github.com/Comfy-Org/ComfyUI
```

What it is:

```text
Modular node graph AI creation engine for images, video, 3D, audio and more, with API endpoints and workflow JSON support.
```

Potential use in Comic Factory:

- primary generation backend
- workflow JSON source of truth
- API batch rendering
- prompt/job execution
- output import

Integration level:

```text
B — already the chosen render engine, but integration is not complete.
```

Risk:

```text
Medium. Custom nodes and workflow versions can break. Need locked workflows.
```

Recommendation:

```text
Next serious render step: export one stable SDXL workflow JSON and map node IDs in code.
```

### 18. ComfyUI-Copilot

Repository:

```text
https://github.com/ATH-MaaS/ComfyUI-Copilot
```

What it is:

```text
AI assistant/custom node for ComfyUI workflow automation and workflow help.
```

Potential use in Comic Factory:

- workflow-generation research
- debugging inspiration
- possible local helper for ComfyUI users

Integration level:

```text
C — inspiration, not dependency.
```

Risk:

```text
Medium. Custom node supply-chain/security must be treated carefully.
```

Recommendation:

```text
Do not auto-install. Study ideas only. Keep our ComfyUI workflow locked and explicit.
```

## Recommended build order for our repo

### Phase A — safe npm-level improvements

1. Add domain modules first.
2. Add tests for package/restore and reference review.
3. Add FilePond or a small custom upload intake only after real asset model exists.
4. Add React Konva for lettering/editor canvas.
5. Add React Flow only when workflow graph view is needed.

### Phase B — backend/service layer

1. Supabase asset database or Zou-inspired data model.
2. Real file storage.
3. imgproxy thumbnails.
4. ComfyUI workflow mapping.
5. Output import and retry logic.

### Phase C — studio-grade integrations

1. Kitsu/Zou concepts for production tracking.
2. OpenCue concepts for render queue scaling.
3. Label Studio/CVAT only for LoRA/dataset workflows.
4. Remotion only after static export is stable.

## Strong recommendation

Do not integrate a huge full platform too early.

The best path is:

```text
Use small libraries for focused UX improvements.
Use large studio tools as architecture references.
Keep our own data model clean.
Do not let a third-party app dictate the whole product.
```

Immediate best candidates for the next actual implementation:

```text
1. Domain modules and tests — no new dependency
2. React Konva — focused comic lettering/editor canvas
3. FilePond — professional asset intake
4. React Flow — production workflow graph
5. imgproxy — later thumbnail service
```
