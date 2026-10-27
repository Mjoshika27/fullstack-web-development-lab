const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;
const DATA = path.join(__dirname, "tasks.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readTasks() {
    try { return JSON.parse(fs.readFileSync(DATA, "utf8")); }
    catch { return []; }
}
function saveTasks(tasks) {
    fs.writeFileSync(DATA, JSON.stringify(tasks, null, 2));
}

app.get("/api/tasks", (req, res) => res.json(readTasks()));

app.post("/api/tasks", (req, res) => {
    const { title, assignedTo, priority, deadline } = req.body;
    if (!title || !assignedTo || !deadline)
        return res.status(400).json({ error: "Fill all required fields." });

    const tasks = readTasks();
    const task = {
        id: Date.now().toString(), title: title.trim(),
        assignedTo: assignedTo.trim(), priority: priority || "Medium",
        deadline, status: "Pending"
    };
    tasks.push(task);
    saveTasks(tasks);
    res.status(201).json(task);
});

app.put("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();
    const i = tasks.findIndex(t => t.id === req.params.id);
    if (i < 0) return res.status(404).json({ error: "Task not found." });
    const { status } = req.body;
    if (status && !["Pending", "In Progress", "Completed"].includes(status))
        return res.status(400).json({ error: "Invalid status." });
    tasks[i] = { ...tasks[i], ...req.body };
    saveTasks(tasks);
    res.json(tasks[i]);
});

app.delete("/api/tasks/:id", (req, res) => {
    const tasks = readTasks();
    const updated = tasks.filter(t => t.id !== req.params.id);
    if (updated.length === tasks.length)
        return res.status(404).json({ error: "Task not found." });
    saveTasks(updated);
    res.json({ message: "Task deleted." });
});

app.listen(PORT, () => console.log(`Open http://localhost:${PORT}`));