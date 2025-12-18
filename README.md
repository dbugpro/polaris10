# 🌌 Polaris 1.0: The 100% Free AI Navigator

Polaris is a high-performance AI navigation interface that uses the **Free Tier** of Google's Gemini models. It provides a premium, "Deep Thinking" experience without any subscription fees.

## 💸 Why it's 100% Free
This project is architected to run entirely on free resources:
- **Frontend Hosting**: [Vercel](https://vercel.com) (Free Hobby Plan)
- **AI Brain**: [Google AI Studio](https://aistudio.google.com/) (Free Tier API)
- **Search Capabilities**: Included for free in the Gemini API preview.

## 🚀 Quick Start (Deploy in 2 Minutes)

### 1. Get your Free API Key
Go to [Google AI Studio](https://aistudio.google.com/) and click **"Get API key"**. Create a key in a new project.

### 2. Fork and Deploy
1. **Fork this repository** to your own GitHub account.
2. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
3. Click **"Add New"** > **"Project"**.
4. Import your `polaris10` fork.
5. In the **Environment Variables** section, add:
   - **Key**: `API_KEY`
   - **Value**: `(Your API Key from Step 1)`
6. Click **"Deploy"**.

## 🧠 Intelligent Modes (All Free)
- **Standard**: Balanced and smart (`gemini-3-flash-preview`).
- **Fast**: Lightning quick responses (`gemini-flash-lite-latest`).
- **Turbo**: High-speed reasoning with active thinking.
- **Deep**: Maximum intelligence for complex tasks (`gemini-3-pro-preview`).

## 🛠️ Developer Customization

### Local Development
1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/polaris10.git
   cd polaris10
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file for Vite:
   ```env
   VITE_API_KEY=your_free_api_key_here
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## 📂 Architecture Note
- **Vite/React/Tailwind**: Modern, fast, and scalable.
- **@google/genai**: Direct integration with Gemini.
- **Glassmorphism UI**: Beautiful, responsive design that works on mobile and desktop.

---

*Built with Polaris 1.0 - Navigation for the next era of intelligence.*