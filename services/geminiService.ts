import { GoogleGenAI, Type, Schema } from "@google/genai";

// Offline fallback questions to ensure the app works without an API Key
const FALLBACK_QUESTIONS = [
  { question: "What is the only continent that covers four hemispheres?", answer: "Africa" },
  { question: "What is the hardest natural substance on Earth?", answer: "Diamond" },
  { question: "Which planet has the most moons?", answer: "Saturn" },
  { question: "What is the chemical symbol for Gold?", answer: "Au" },
  { question: "How many hearts does an octopus have?", answer: "Three" },
  { question: "What is the capital city of Australia?", answer: "Canberra" },
  { question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci" },
  { question: "What is the smallest prime number?", answer: "Two" },
  { question: "In which year did the Titanic sink?", answer: "1912" },
  { question: "What is the fastest land animal?", answer: "Cheetah" },
  { question: "Which element is necessary for rust to form?", answer: "Oxygen" },
  { question: "What is the largest ocean on Earth?", answer: "Pacific Ocean" },
  { question: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare" },
  { question: "What covers approximately 71% of the Earth's surface?", answer: "Water" },
  { question: "What is the powerhouse of the cell?", answer: "Mitochondria" },
  { question: "Which country invented tea?", answer: "China" },
  { question: "How many bones are in the adult human body?", answer: "206" },
  { question: "What is the speed of light?", answer: "Approximately 299,792 kilometers per second" },
  { question: "What gas do plants absorb from the atmosphere?", answer: "Carbon Dioxide" },
  { question: "What is the tallest mountain in the world?", answer: "Mount Everest" }
];

const getFallbackQuestion = () => {
  const randomIndex = Math.floor(Math.random() * FALLBACK_QUESTIONS.length);
  return FALLBACK_QUESTIONS[randomIndex];
};

export const generateQuizQuestion = async (topic: string = "General Knowledge"): Promise<{ question: string; answer: string } | null> => {
  const apiKey = process.env.API_KEY;

  // 1. Offline Mode: If no API key is present, use local data immediately.
  if (!apiKey) {
    console.log("No API Key found. Using offline fallback questions.");
    // Simulate a small network delay for realism
    await new Promise(resolve => setTimeout(resolve, 600));
    return getFallbackQuestion();
  }

  // 2. Online Mode: Try to use Gemini API
  try {
    const ai = new GoogleGenAI({ apiKey });

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        question: {
          type: Type.STRING,
          description: "A fun, engaging, short trivia question.",
        },
        answer: {
          type: Type.STRING,
          description: "The correct answer to the question.",
        },
      },
      required: ["question", "answer"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a fun, concise trivia question about "${topic}" suitable for a middle school or high school classroom context. Keep it engaging.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.9, // Higher temperature for more variety
      },
    });

    const text = response.text;
    if (!text) return getFallbackQuestion();

    return JSON.parse(text);
  } catch (error) {
    console.warn("Error connecting to Gemini API, switching to offline mode:", error);
    return getFallbackQuestion();
  }
};