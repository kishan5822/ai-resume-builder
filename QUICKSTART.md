# 🚀 Quick Start Guide

## Installation (5 Minutes)

### Step 1: Install Prerequisites

**Node.js** (Required)
- Download from: https://nodejs.org/
- Choose the LTS version (v18 or higher)
- Verify installation: `node --version`

**Tectonic** (Required for PDF generation)

**Windows:**
```powershell
# Using Chocolatey
choco install tectonic

# Or download installer from:
# https://github.com/tectonic-typesetting/tectonic/releases
```

**Mac:**
```bash
brew install tectonic
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install tectonic

# Or using Cargo
cargo install tectonic
```

Verify: `tectonic --version`

### Step 2: Get an API Key

Choose one (or both):

**Option A: OpenRouter** (Recommended - Access to 340+ models)
1. Go to https://openrouter.ai/
2. Sign up for free
3. Get your API key from dashboard
4. Add credits ($5 gets you ~1000 resume edits)

**Option B: Google Gemini** (Free tier available)
1. Go to https://ai.google.dev/
2. Get API key
3. Free tier: 60 requests/minute

### Step 3: Install the App

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-resume-builder.git
cd ai-resume-builder

# Install all dependencies (this takes ~2 minutes)
npm install
```

### Step 4: Start the App

**Windows:**
```powershell
.\start.ps1
```

**Mac/Linux:**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client
npm start
```

The app will open automatically at http://localhost:3000

### Step 5: Configure API Key

1. Click the ⚙️ **Settings** icon (top right)
2. Paste your API key
3. Select your preferred model:
   - **Claude 3.5 Sonnet** - Best quality (recommended)
   - **GPT-4** - Excellent results
   - **Gemini Pro** - Fast and free tier available
4. Click **Save**

## First Resume

### Option 1: Start Fresh
1. Click **"Start New Resume"**
2. A professional template loads
3. Tell AI: "Change my name to [Your Name]"
4. Continue chatting to customize

### Option 2: Upload Existing
1. Click **"Upload Resume"**
2. Select your PDF, DOCX, or LaTeX file
3. AI will help you improve it

## Common Commands

**Add content:**
- "Add Python to my programming skills"
- "Add a job: Software Engineer at Google, Jan 2020 - Present"

**Modify content:**
- "Rewrite my summary to highlight leadership"
- "Make my experience bullets more impactful"

**Remove content:**
- "Remove MySQL from my skills"
- "Delete my first internship"

## Troubleshooting

**"Port already in use" error?**
```bash
# Windows
Stop-Process -Name "node" -Force
# Mac/Linux
killall node
```

**Tectonic not found?**
- Make sure it's installed: `tectonic --version`
- Restart your terminal
- On Windows, restart computer after installation

**AI not responding?**
- Check your API key in Settings
- Verify you have API credits
- Check internet connection

**PDF not generating?**
- Ensure Tectonic is installed
- Check LaTeX syntax (look for errors in console)

## Next Steps

- ⭐ Star the repo if you find it useful
- 📖 Read the full README.md
- 🐛 Report bugs on GitHub Issues
- 💡 Suggest features

## Getting Help

- GitHub Issues: Report bugs
- Discussions: Ask questions
- Discord: Join our community (coming soon)

---

**Need help?** Open an issue with the `help` label!

Enjoy building your resume! 🎉
