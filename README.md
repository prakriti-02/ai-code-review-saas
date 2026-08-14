# 🤖 AI Code Review SaaS

An AI-powered Code Review SaaS that analyzes source code and provides intelligent feedback, suggestions, and a code quality score using Google Gemini AI.

## 🚀 Features

- 🤖 AI-powered code review using Gemini
- 🔐 User authentication with JWT
- 👤 User-specific review history
- 🗑️ Delete previous reviews
- 📝 Support for multiple programming languages
- 📊 Code quality score
- ⚡ FastAPI backend
- ⚛️ React frontend
- 🗄️ MongoDB database
- 🌙 Premium dark SaaS interface
- 📱 Responsive UI

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
- Monaco Editor

### Backend
- Python
- FastAPI
- Pydantic
- JWT Authentication

### AI
- Google Gemini API

### Database
- MongoDB
- PyMongo

## 🏗️ Project Structure

```text
ai-code-review-saas/
│
├── app/
│   ├── auth/
│   ├── database/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── main.py
├── requirements.txt
├── package.json
├── .gitignore
└── README.md