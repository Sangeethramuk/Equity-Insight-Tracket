
# EquityInsight Tracker 📈

A sophisticated, professional-grade stock purchase log and portfolio analysis tool. This application helps investors track their entry valuations (PE, PB, EPS) at the time of purchase and compares them with real-time market data to provide actionable insights.

## ✨ Key Features
- **Transaction Logging**: Track purchase price, quantity, date, and fundamental metrics (PE, PB, EPS).
- **Live Market Sync**: Uses Gemini AI (Google Search Grounding) to fetch real-time Indian stock market prices and fundamentals.
- **AI Portfolio Analysis**: Get professional reports on your portfolio valuation and strategy using Gemini 2.5 Flash.
- **Smart Recommendations**: Identifies "Accumulation" (Buy) and "Distribution" (Sell) signals based on your historical average purchase multiples.
- **PWA Ready**: Installable as a standalone app on Android/iOS/Desktop.
- **XIRR Calculation**: Sophisticated time-weighted return tracking for accurate performance measurement.

## 🚀 Getting Started

### Local Development
1. Clone the repository.
2. Open `index.html` in a modern browser.
3. Ensure you have an API key for the Gemini API (set via `process.env.API_KEY` in the execution environment).

### How to use
- **Dashboard**: Overview of your net worth and asset allocation.
- **Recommendations**: See which of your holdings are currently "cheap" compared to when you first bought them.
- **AI Report**: Click the "AI Report" button for a deep-dive analysis of your current holdings.

## 🛠 Tech Stack
- **Frontend**: React (ESM), Tailwind CSS, Lucide-like SVG Icons.
- **Intelligence**: Google Gemini API (@google/genai).
- **Charts**: Recharts.
- **Persistence**: LocalStorage (Privacy-first).

## 📄 License
MIT
