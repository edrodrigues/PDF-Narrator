# AI PDF Analyzer & Explainer

## Overview

This application allows users to upload PDF documents, which are then analyzed by Google's Gemini AI to generate a concise summary. Users can select the output language for the summary (English or Brazilian Portuguese) and listen to an audio explanation of the summary using their browser's built-in text-to-speech capabilities.

## Features

*   **PDF Upload:** Upload PDF files directly through the browser.
*   **Text Extraction:** Automatically extracts text content from the uploaded PDFs.
*   **AI Summarization:** Utilizes Google's Gemini AI model to generate summaries of the PDF content.
*   **Language Selection:** Choose between English and Brazilian Portuguese for the summary output.
*   **Audio Explanation:** Plays the generated summary aloud using the browser's Text-to-Speech API.
*   **User Experience:** Responsive user interface with clear loading indicators and error messages for a smooth experience.

## Tech Stack

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **PDF Processing:** `pdfjs-dist`
*   **AI Model:** Google Gemini (via `@google/genai` SDK)
*   **Text-to-Speech:** Browser's native `SpeechSynthesis` API

## Prerequisites

*   **Node.js:** Ensure you have Node.js installed. (Visit [nodejs.org](https://nodejs.org/) for installation instructions).
*   **Google Gemini API Key:** You need an active API key from Google AI Studio to use the summarization feature.

## Environment Variables

To run the application, you need to set up your Google Gemini API key:

1.  Create a file named `.env.local` in the root directory of the project.
2.  Add your API key to this file in the following format:

    ```env
    GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY
    ```

    Replace `YOUR_ACTUAL_GEMINI_API_KEY` with your real API key.

## Setup and Running Locally

1.  **Clone the Repository (if you haven't already):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
    (If you've downloaded the files directly, navigate to the project directory.)

2.  **Install Dependencies:**
    Open your terminal and run:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variable:**
    Ensure you have created the `.env.local` file in the project root and added your `GEMINI_API_KEY` as described above.

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

5.  **Open in Browser:**
    Once the server is running (usually indicated by a message like `VITE vX.X.X  ready in XXX ms`), open the URL provided (e.g., `http://localhost:5173`) in your web browser.

## Available Scripts

In the project directory, you can run the following commands:

*   **`npm run dev`**
    *   Runs the application in development mode with hot reloading.

*   **`npm run build`**
    *   Builds the application for production to the `dist` folder.

*   **`npm run preview`**
    *   Serves the production build locally to preview it before deployment.

---

This README provides a comprehensive guide for users and developers to understand, set up, and run the AI PDF Analyzer & Explainer application.
