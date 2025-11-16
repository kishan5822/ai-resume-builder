# 🚀 AI Resume Builder# AI Resume Builder - Professional LaTeX Resume Editor# 🚀 AI Resume Builder



> A modern web application that helps you create and optimize professional LaTeX resumes using AI assistance.



![License](https://img.shields.io/badge/license-MIT-blue.svg)A modern, AI-powered resume builder with real-time LaTeX editing, intelligent section updates, and animated code modifications. Built with React, Node.js, and Tectonic LaTeX compiler.A modern, AI-powered resume builder with real-time LaTeX editing, similar to Overleaf but with AI assistance for tailoring resumes to job descriptions.

![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

![React](https://img.shields.io/badge/react-18.3.1-blue)



## 📖 What is This?## 🌟 Features## ✨ Features



AI Resume Builder is a smart tool that combines professional resume formatting with AI-powered content suggestions. Think of it as having a career coach and a LaTeX expert working together to help you create the perfect resume.



**No LaTeX knowledge needed** - just chat with the AI in plain English to create and edit your resume!### Core Functionality- 📝 **Real-time LaTeX Editor** - Edit your resume with live preview



### ✨ Key Features- **🎨 Overleaf-Style 3-Panel Layout**: Code Editor | PDF Preview | AI Chat- 🤖 **AI-Powered Editing** - Chat with AI to refine your resume based on job descriptions



- 🤖 **AI-Powered Editing** - Tell the AI what you want, and it updates your resume- **⚡ Real-Time Compilation**: Instant PDF updates with Tectonic compiler- 📄 **Multiple Upload Formats** - Support for PDF, DOCX, and LaTeX files

- 📄 **Real-time Preview** - See your changes instantly as a professional PDF

- 💬 **Chat Interface** - Edit your resume by having a conversation- **🤖 AI-Powered Editing**: Natural language commands for resume updates- 🎨 **FAANGPath Template** - Professional resume template used by top companies

- 🎨 **Professional Templates** - Beautiful, recruiter-friendly layouts

- 🔄 **Smart Learning** - AI gets better by learning from your preferences- **📝 Intelligent Section Merging**: Updates specific sections without losing data- 🔄 **Live Preview** - See changes as you type (debounced for performance)

- 🌐 **380+ AI Models** - Choose from GPT-4, Claude, Gemini, and more

- 💾 **Auto-Save** - Never lose your work- **✨ Animated Code Editing**: Character-by-character visual code changes- 💾 **Local Storage** - Your resumes are saved locally (no account needed)

- 📊 **Quality Tracking** - Rate AI suggestions to improve future responses

- **🔄 Resizable Panels**: Drag-to-resize with smooth transitions- 🎯 **Job Description Matching** - AI tailors your resume to specific job postings

## 🎯 How It Works

- **📄 Interactive PDF**: Clickable links, text selection, native browser controls

1. **Start** - Load a professional template or upload your existing resume

2. **Chat** - Tell the AI what you want (e.g., "Add Python to my skills")- **💾 Auto-Save**: Automatic local storage of resume and chat history## 🛠️ Tech Stack

3. **Review** - See the changes in real-time on the PDF preview

4. **Download** - Export your polished resume as PDF



### Example Conversations### AI Capabilities**Frontend:**



```1. **Smart Section Updates**: "Rewrite my professional summary" → Updates only that section- React.js

You: "Add a professional summary about my 5 years in data analysis"

AI: ✓ I've added a compelling summary highlighting your experience2. **Animated Edits**: "Change my name to John Smith" → Watch live character-by-character editing- Tailwind CSS



You: "Remove MySQL from my technical skills"  3. **Job Tailoring**: Upload job descriptions for ATS-optimized resumes- CodeMirror (LaTeX editor)

AI: ✓ Updated skills section with MySQL removed

4. **Content Generation**: Create complete resumes from scratch with AI guidance- React PDF Viewer

You: "Make my work experience more impactful"

AI: ✓ Enhanced with strong action verbs and quantified results5. **Multi-Model Support**: Claude 3.5 Sonnet, GPT-4, and more via OpenRouter

```

**Backend:**

## 🛠️ Technologies Used

## 🚀 Getting Started- Node.js + Express

### Frontend (What You See)

- **React** - Modern web framework for smooth user interface- Tectonic (LaTeX compiler)

- **Tailwind CSS** - Beautiful, responsive design

- **React Hot Toast** - Elegant notification messages### Prerequisites- OpenRouter API (AI)

- **Syntax Highlighter** - Code preview with VS Code-style colors

- Node.js >= 18.0.0- pdf-parse, mammoth (file parsing)

### Backend (Behind the Scenes)

- **Node.js** - JavaScript runtime for the server- Tectonic LaTeX compiler

- **Express** - Web framework for API endpoints

- **SQLite** - Lightweight database to remember your preferences## 📋 Prerequisites

- **Tectonic** - Modern LaTeX compiler for PDF generation

### Quick Start

### AI Integration

- **OpenRouter** - Access to 340+ AI models (GPT-4, Claude, Llama, etc.)Before you begin, ensure you have the following installed:

- **Google Gemini** - Google's advanced AI models (40+ options)

- **Smart Learning** - Learns from highly-rated responses to improve suggestions1. **Start Backend** (Terminal 1):



## 📦 Installation   ```bash1. **Node.js** (v18 or higher)



### What You'll Need   cd server   - Download from: https://nodejs.org/



1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)   npm start

2. **Tectonic** (LaTeX compiler) - [Installation guide](https://tectonic-typesetting.github.io/)

3. **API Key** from [OpenRouter](https://openrouter.ai) or [Google AI](https://ai.google.dev)   ```2. **Tectonic** (LaTeX compiler)



### Setup Steps   



1. **Download the project**2. **Start Frontend** (Terminal 2):   **Windows:**

   ```bash

   git clone https://github.com/yourusername/ai-resume-builder.git   ```bash   ```powershell

   cd ai-resume-builder

   ```   cd client   # Using Chocolatey



2. **Install everything**   npm start   choco install tectonic

   ```bash

   npm install   ```   

   ```

   # Or download installer from:

3. **Set up environment** (optional)

   3. **Configure API Key**:   # https://github.com/tectonic-typesetting/tectonic/releases

   The app works out of the box! But if you want custom settings:

      - Open http://localhost:3000   ```

   Create `server/.env`:

   ```env   - Click Settings → Add OpenRouter API key   

   PORT=5000

   NODE_ENV=development   - Start building your resume!   **macOS:**

   ```

   ```bash

   Create `client/.env`:

   ```env## 📁 Project Structure   brew install tectonic

   REACT_APP_API_URL=http://localhost:5000

   ```   ```



4. **Start the app**```   

   

   **Windows:**Ai_resume/   **Linux:**

   ```bash

   .\start.ps1├── client/              # React frontend   ```bash

   ```

   │   ├── src/   # Using Cargo (Rust package manager)

   **Mac/Linux:**

   ```bash│   │   ├── components/  # UI components   cargo install tectonic

   # Terminal 1

   cd server && npm start│   │   ├── services/    # Business logic   



   # Terminal 2│   │   └── utils/       # Helper functions   # Or download from releases

   cd client && npm start

   ```│   └── package.json   ```



5. **Open your browser**├── server/              # Node.js backend

   ```

   http://localhost:3000│   ├── routes/          # API endpoints3. **OpenRouter API Key**

   ```

│   ├── services/        # AI integration   - Sign up at: https://openrouter.ai/

## 🎮 Using the App

│   ├── temp/            # Compilation temp files   - Get your API key from the dashboard

### Getting Started

│   └── server.js   - You'll enter this in the app's settings

1. **Configure API Key**

   - Click the ⚙️ Settings icon├── resume.cls           # LaTeX template

   - Add your OpenRouter or Gemini API key

   - Select your favorite AI model└── *.md                 # Documentation## 🚀 Installation



2. **Create Resume**

   - Click **"Start New Resume"** for a template

   - Or **"Upload Resume"** to import an existing oneKey Components:### Quick Start (Recommended)



### Editing Your Resume- CodeCanvas.js: LaTeX editor with formatting toolbar



Just type what you want to change:- PDFPreview.js: Interactive PDF viewer**Windows PowerShell:**



**Adding Content:**- ResizableLayout.js: 3-panel resizable interface```powershell

- "Add Python and JavaScript to my programming skills"

- "Add a new job: Data Analyst at Microsoft, 2020-2023"- codeEditor.js: Animated editing engine.\start.ps1



**Modifying Content:**- latexSection.js: Smart section merging```

- "Rewrite my professional summary to emphasize leadership"

- "Make my bullet points more action-oriented"```



**Removing Content:****Windows Command Prompt:**

- "Remove my outdated PHP skill"

- "Delete my first internship"## 🎯 Usage Examples```cmd



**General Improvements:**start.bat

- "Make this resume more suited for a software engineer role"

- "Add more quantifiable achievements"### Quick Edits (Animated)```



### Tips for Best Results```



✅ **Be specific** - "Add React to my frontend skills" vs "update skills""change my email to john@example.com"**Check Your System:**

✅ **One change at a time** - Easier to review and control

✅ **Rate responses** - Use 👍/👎 to train the AI"update phone to +1-555-1234"  ```powershell

✅ **Always preview** - Check the PDF before downloading

"change my name to Jane Smith".\check-system.ps1

## 🗂️ Project Structure

``````

```

ai-resume-builder/

│

├── client/                 # Frontend application### Section Updates (Smart Merge)### Manual Installation

│   ├── src/

│   │   ├── components/    # React UI components```

│   │   │   ├── ChatPanel.js       # AI chat interface

│   │   │   ├── CodeCanvas.js      # LaTeX editor"rewrite my professional summary"1. **Clone or navigate to the project:**

│   │   │   ├── PDFPreview.js      # PDF viewer

│   │   │   └── InlineSettings.js  # Settings panel"make my experience section more concise"   ```bash

│   │   ├── services/      # API communication

│   │   │   ├── api.js            # API calls"improve my skills section"   cd Ai_resume

│   │   │   └── latexSection.js   # LaTeX processing

│   │   └── utils/         # Helper functions```   ```

│   └── package.json

│

├── server/                # Backend application

│   ├── routes/           # API endpoints### Content Generation2. **Install dependencies:**

│   │   └── ai.js         # AI-related routes

│   ├── services/         # Business logic```   ```powershell

│   │   ├── aiService.js          # AI integration

│   │   └── databaseService.js    # Data storage"help me write a summary for a software engineer"   npm run install:all

│   ├── data/             # SQLite database

│   ├── output/           # Generated PDFs"generate bullet points for my Google experience"   # Or manually:

│   └── package.json

│```   # npm install

├── start.ps1             # Quick start script (Windows)

└── README.md             # You are here!   # cd server && npm install

```

## 🔧 Configuration   # cd ../client && npm install

## 🔒 Privacy & Security

   ```

Your data is safe:

### Animation Speed

- ✅ **API Keys** - Stored only in your browser (localStorage)

- ✅ **Resume Content** - Saved locally on your computerEdit `client/src/App.js` line 128:3. **Configure environment variables:**

- ✅ **AI Requests** - Sent directly to OpenRouter/Gemini (we never see them)

- ✅ **Learning Data** - Only response ratings are stored, not content```javascript   ```powershell



## 🐛 Troubleshootingspeed: 20,              // ms per character   # Create .env file in server directory



**App won't start?**highlightDuration: 1500, // highlight time   cp .env.example server/.env

- Make sure Node.js v18+ is installed: `node --version`

- Try: `npm install` then restartscrollDelay: 200        // scroll delay   



**PDF not generating?**```   # Edit server/.env if needed (optional for MVP)

- Check if Tectonic is installed: `tectonic --version`

- On Windows, restart terminal after installing Tectonic   ```



**AI not responding?**### AI Models

- Verify your API key in Settings

- Check your internet connectionSupported via OpenRouter:4. **Verify Tectonic installation:**

- Make sure your API key has credits

- Claude 3.5 Sonnet (recommended)   ```powershell

**Changes not showing?**

- Refresh the page (Ctrl+R or Cmd+R)- GPT-4, GPT-4 Turbo   tectonic --version

- Check browser console (F12) for errors

- Llama 3.1, Mixtral   ```

## 🤝 Contributing

- 20+ other models

Want to make this better? Contributions are welcome!

### 📖 Additional Help

1. Fork the project

2. Create a feature branch: `git checkout -b feature/AmazingFeature`## 📚 Documentation

3. Commit your changes: `git commit -m 'Add AmazingFeature'`

4. Push to branch: `git push origin feature/AmazingFeature`- **Visual Setup Guide**: Open `SETUP.html` in your browser

5. Open a Pull Request

- **AI_EDITING_FEATURE.md**: Animated editing system- **Quick Start**: Read `QUICKSTART.md`

### Ideas for Future Features

- Multiple resume templates- **SECTION_UPDATE_FIX.md**: Smart section merging- **System Check**: Run `check-system.ps1`

- Export to Word format

- Resume analytics dashboard- **resume_faangpath.tex**: Sample LaTeX template- **FAQ**: Check `FAQ.md` for common issues

- Cover letter generator

- LinkedIn profile optimizer



## 📝 License## 🐛 Troubleshooting## 🎯 Usage



MIT License - feel free to use this for personal or commercial projects!



## 🙏 Credits**Servers not starting?**1. **Start the development server:**



Built using amazing open-source tools:- Check if ports 3000 and 5000 are available   ```powershell

- **Tectonic** - Modern LaTeX compilation

- **OpenRouter** - AI model aggregation- Run `npm install` in both client and server   npm run dev

- **Google Gemini** - Advanced AI models

- **React** - UI framework   ```

- **Tailwind CSS** - Styling framework

**PDF not compiling?**   

## 📧 Support

- Ensure Tectonic is installed and in PATH   This will start:

Found a bug? Have a suggestion?

- Open an issue on GitHub- Check resume.cls exists in project root   - Frontend: http://localhost:3000

- Or submit a pull request

   - Backend: http://localhost:5000

---

**AI not responding?**

**Made with ❤️ for job seekers**

- Verify OpenRouter API key in Settings2. **Configure OpenRouter API:**

*Turn your career story into a polished resume with the power of AI*

- Check browser console for errors   - Click the settings icon ⚙️ in the top right

[⭐ Star this repo](https://github.com/yourusername/ai-resume-builder) if you found it helpful!

   - Enter your OpenRouter API key

## 🛠️ Tech Stack   - Select your preferred AI model



**Frontend**: React, CodeMirror, Tailwind CSS3. **Create or Upload Resume:**

**Backend**: Node.js, Express, Tectonic   - Start with a new resume using the FAANGPath template

**AI**: OpenRouter API   - Or upload an existing PDF/DOCX/LaTeX resume



## 📝 License4. **Edit with AI:**

   - Paste job description in chat: "Here's the JD: [paste description]"

MIT License - Open source and free to use!   - Or upload JD as PDF/DOCX

   - Chat with AI to tailor your resume

---   - Edit LaTeX directly in the editor



**Built with ❤️ for job seekers**5. **Download:**

   - Your resume auto-compiles to PDF

Version 1.0.0 | Last Updated: October 11, 2025   - Download anytime from the preview panel


## 📁 Project Structure

```
Ai_resume/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── utils/         # Helper functions
│   │   └── App.js
│   └── package.json
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── utils/            # Utilities
│   └── package.json
├── resume.cls            # LaTeX template class
├── resume_faangpath.tex  # Template file
└── package.json          # Root package.json

```

## 🔧 Configuration

### OpenRouter Models

The app supports all OpenRouter models. Popular choices:
- `anthropic/claude-3.5-sonnet` (Recommended)
- `openai/gpt-4-turbo`
- `google/gemini-pro`
- `meta-llama/llama-3.1-70b`

### LaTeX Templates

Currently includes FAANGPath template. To add more templates:
1. Add `.cls` and `.tex` files to project root
2. Update `server/templates/` directory
3. Modify template selector in UI

## 🐛 Troubleshooting

**Tectonic not found:**
- Ensure Tectonic is in your PATH
- Restart terminal after installation
- Manually set `TECTONIC_PATH` in `server/.env`

**API errors:**
- Verify OpenRouter API key in settings
- Check API key has credits
- Ensure internet connection

**PDF not compiling:**
- Check LaTeX syntax errors
- View compilation logs in browser console
- Ensure Tectonic is working: `tectonic --version`

## 🎨 UI Components

Beautiful components from [UIverse.io](https://uiverse.io/) are integrated for:
- Animated buttons
- Loading spinners
- Toggle switches
- Card animations
- Hover effects

## 📝 License

MIT License - feel free to use for personal and commercial projects!

## 🤝 Contributing

Contributions welcome! Future enhancements:
- User authentication (Firebase)
- Multiple resume templates
- Cloud storage
- Resume analytics
- ATS compatibility checker

## 🌟 Acknowledgments

- FAANGPath for the excellent LaTeX template
- OpenRouter for AI API aggregation
- UIverse.io for beautiful UI components
- Tectonic for modern LaTeX compilation

---

Built with ❤️ for job seekers worldwide
