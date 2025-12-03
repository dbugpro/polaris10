# Polaris 1.0

Polaris is an advanced AI navigator interface powered by Google's Gemini 2.5 Flash model. It features a responsive chat interface, image analysis capabilities, and real-time Google Search grounding.

## Features

- **Gemini 2.5 Flash Integration**: Uses the latest fast and efficient model from Google.
- **Search Grounding**: Provides sources for factual queries using Google Search.
- **Multimodal**: Supports text and image inputs.
- **Responsive Design**: Glassmorphism UI optimized for desktop and mobile.
- **Visual Feedback**: Dynamic Orb animations for idle and thinking states.

## Prerequisites

- **Google AI Studio API Key**: You need an API key from [Google AI Studio](https://aistudio.google.com/).

## Quick Start (No Build Required)

This application uses modern browser features (ES Modules) and does not require a complex build step (like Webpack or Vite) to run in its default state.

### 1. Set the API Key
Because this runs in the browser, you must make the API Key available to the environment.

**Option A (Local Development):**
If running locally, you must ensure `process.env.API_KEY` is replaced or defined. Since this is a client-side app, the easiest way for quick testing is to manually set it in your browser console or serve it with an environment injector, **BUT** the secure way for this template is to rely on the environment it runs in (like a cloud sandbox).

**If you are running this locally on your machine:**
1. Open `services/geminiService.ts`.
2. Locate `const apiKey = process.env.API_KEY;`.
3. **Temporary for local testing:** Replace it with your actual key string: `const apiKey = "YOUR_ACTUAL_KEY";` (Do not commit this file with your key!).

### 2. Run the Server
You simply need to serve the `index.html` file using a static file server.

**Using Python:**
```bash
# Run inside the project directory
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```

**Using Node.js (`serve`):**
```bash
npx serve .
```

**Using VS Code:**
1. Install the "Live Server" extension.
2. Right-click `index.html` and select "Open with Live Server".

## Project Structure

```text
/
├── index.html              # Entry point (Import maps & Styles)
├── index.tsx               # React Root
├── App.tsx                 # Main Application Component
├── types.ts                # TypeScript Interfaces
├── metadata.json           # App configuration
├── services/
│   └── geminiService.ts    # Gemini API Logic
└── components/
    ├── Orb.tsx             # Visual Orb Component
    └── MessageItem.tsx     # Chat Message Component
```

## Advanced: Porting to Vite/Production

If you want to build this for production with bundling, minification, and proper environment variable management (.env files):

1. **Initialize Vite**: `npm create vite@latest polaris -- --template react-ts`
2. **Move Files**: Copy the `components`, `services`, and `App.tsx` into the `src` folder of the new project.
3. **Install Dependencies**:
   ```bash
   npm install lucide-react @google/genai react-markdown
   ```
4. **Update Env**: Create a `.env` file:
   ```
   VITE_API_KEY=your_key_here
   ```
5. **Update Code**: Change `process.env.API_KEY` to `import.meta.env.VITE_API_KEY` in `geminiService.ts`.
