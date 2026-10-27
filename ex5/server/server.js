const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 5000;
const QUESTIONS_FILE = path.join(__dirname, "questions.json");
const DATA_DIR = path.join(__dirname, "data");
const RESPONSES_FILE = path.join(DATA_DIR, "responses.json");

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_FILE)) fs.writeFileSync(RESPONSES_FILE, "[]", "utf8");

const readResponses = () => JSON.parse(fs.readFileSync(RESPONSES_FILE, "utf8"));
const writeResponses = (data) => fs.writeFileSync(RESPONSES_FILE, JSON.stringify(data, null, 2), "utf8");

function selectFiveQuestions() {
  const bank = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));
  const shuffled = [...bank];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 5);
}

function validateResponses(responses) {
  if (!Array.isArray(responses) || responses.length !== 5) return "Exactly five answers are required.";
  const ids = responses.map((item) => item.questionId);
  if (new Set(ids).size !== 5) return "The survey must contain five different questions.";
  if (responses.some((item) => !item.answer || !String(item.answer).trim())) return "Please answer all five questions.";
  const bank = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));
  if (responses.some((item) => !bank.some((question) => question.id === item.questionId))) return "An unknown question was submitted.";
  return null;
}

app.get("/", (req, res) => res.send("Online Survey Server Running"));
app.get("/api/health", (req, res) => res.json({ status: "ok", app: "Online Survey Server" }));

app.get("/api/survey/questions", (req, res) => {
  const questions = selectFiveQuestions();
  res.json({ questions });
});

app.get("/api/survey/responses", (req, res) => res.json(readResponses()));

app.post("/api/survey/responses", (req, res) => {
  const { respondentName = "", responses } = req.body || {};
  const error = validateResponses(responses);
  if (error) return res.status(400).json({ message: error });
  const allResponses = readResponses();
  const record = {
    id: crypto.randomUUID(),
    respondentName: String(respondentName).trim().slice(0, 80),
    submittedAt: new Date().toISOString(),
    responses: responses.map((item) => ({
      questionId: String(item.questionId),
      questionText: String(item.questionText || ""),
      type: item.type === "text" ? "text" : "choice",
      options: Array.isArray(item.options) ? item.options : [],
      answer: String(item.answer).trim().slice(0, 1000),
    })),
  };
  allResponses.unshift(record);
  writeResponses(allResponses);
  res.status(201).json({ message: "Survey submitted successfully!", response: record });
});

app.put("/api/survey/responses/:id", (req, res) => {
  const allResponses = readResponses();
  const index = allResponses.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Survey response not found." });
  const { respondentName = "", responses } = req.body || {};
  const error = validateResponses(responses);
  if (error) return res.status(400).json({ message: error });
  allResponses[index] = {
    ...allResponses[index],
    respondentName: String(respondentName).trim().slice(0, 80),
    updatedAt: new Date().toISOString(),
    responses: responses.map((item) => ({
      questionId: String(item.questionId),
      questionText: String(item.questionText || ""),
      type: item.type === "text" ? "text" : "choice",
      options: Array.isArray(item.options) ? item.options : [],
      answer: String(item.answer).trim().slice(0, 1000),
    })),
  };
  writeResponses(allResponses);
  res.json({ message: "Survey response updated successfully!", response: allResponses[index] });
});

app.delete("/api/survey/responses/:id", (req, res) => {
  const allResponses = readResponses();
  const index = allResponses.findIndex((item) => item.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Survey response not found." });
  const [removed] = allResponses.splice(index, 1);
  writeResponses(allResponses);
  res.json({ message: "Survey response deleted successfully!", removed });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
