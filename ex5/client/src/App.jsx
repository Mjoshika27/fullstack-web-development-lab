import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/survey";

function App() {
  const [respondentName, setRespondentName] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [allResponses, setAllResponses] = useState([]);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchResponses();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/questions`);
      setQuestions(res.data.questions);
      setAnswers(Object.fromEntries(res.data.questions.map((question) => [question.id, ""])));
      setError("");
    } catch (err) {
      setError("Failed to load questions. Start the backend server and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const res = await axios.get(`${API}/responses`);
      setAllResponses(res.data);
    } catch (err) {
      setError("Could not load saved survey responses. Check whether the backend is running.");
    }
  };

  const handleChange = (questionId, value) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (questions.length !== 5) {
      setError("Five questions could not be loaded. Please try again.");
      return;
    }
    const missing = questions.find((question) => !String(answers[question.id] || "").trim());
    if (missing) {
      setError("Please answer all five questions.");
      return;
    }
    const responses = questions.map((question) => ({
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      options: question.options || [],
      answer: String(answers[question.id]).trim(),
    }));
    const data = { respondentName: respondentName.trim(), responses };
    try {
      setError("");
      if (editId) {
        await axios.put(`${API}/responses/${editId}`, data);
        setMessage("Survey response updated successfully!");
        setEditId(null);
      } else {
        await axios.post(`${API}/responses`, data);
        setMessage("Survey submitted successfully!");
      }
      setRespondentName("");
      await fetchQuestions();
      await fetchResponses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save survey. Please try again.");
    }
  };

  const handleEdit = (record) => {
    setRespondentName(record.respondentName || "");
    setQuestions(record.responses.map((answer) => ({
      id: answer.questionId,
      text: answer.questionText,
      type: answer.type,
      options: answer.options || [],
    })));
    setAnswers(Object.fromEntries(record.responses.map((answer) => [answer.questionId, answer.answer])));
    setEditId(record.id);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this survey response?")) return;
    try {
      await axios.delete(`${API}/responses/${id}`);
      setMessage("Survey response deleted successfully!");
      setError("");
      fetchResponses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the response.");
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setRespondentName("");
    setMessage("");
    fetchQuestions();
  };

  return (
    <div className="container">
      <h1>Online Survey Form</h1>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="survey-form">
        <label htmlFor="respondentName">Name (optional):</label>
        <input
          id="respondentName"
          type="text"
          value={respondentName}
          onChange={(e) => setRespondentName(e.target.value)}
          placeholder="Enter your name"
          maxLength={80}
        />

        <div className="question-heading">
          <h2>Answer the 5 randomly selected questions</h2>
          <button type="button" className="refresh-btn" onClick={fetchQuestions} disabled={loading || Boolean(editId)}>
            {loading ? "Loading..." : "Get new questions"}
          </button>
        </div>

        {questions.map((question, index) => (
          <div className="question" key={question.id}>
            <label className="question-label">{index + 1}. {question.text} <span>*</span></label>
            {question.type === "choice" ? (
              <div className="options">
                {question.options.map((option) => (
                  <label className="option" key={option}>
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={() => handleChange(question.id, option)}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows="2"
                value={answers[question.id] || ""}
                onChange={(e) => handleChange(question.id, e.target.value)}
                placeholder="Type your answer"
                maxLength={1000}
                required
              />
            )}
          </div>
        ))}

        <button type="submit" disabled={loading || questions.length !== 5}>
          {editId ? "Update Response" : "Submit Survey"}
        </button>
        {editId && <button type="button" className="cancel-btn" onClick={cancelEdit}>Cancel Edit</button>}
      </form>

      <h2 className="table-title">All Survey Responses</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>Name</th><th>Submitted</th><th>Questions Answered</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {allResponses.length === 0 ? (
              <tr><td colSpan="4" className="empty">No survey responses yet</td></tr>
            ) : (
              allResponses.map((record) => (
                <tr key={record.id}>
                  <td>{record.respondentName || "Anonymous"}</td>
                  <td>{new Date(record.submittedAt).toLocaleString()}</td>
                  <td>{record.responses.length}</td>
                  <td>
                    <button type="button" className="edit-btn" onClick={() => handleEdit(record)}>Edit</button>
                    <button type="button" className="delete-btn" onClick={() => handleDelete(record.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
