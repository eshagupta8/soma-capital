"use client";
import { Todo } from "@prisma/client";
import { useState, useEffect } from "react";

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  };

  const handleAddTodo = async () => {
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTodo,
          dueDate: dueDate || null,
        }),
      });

      const data = await response.json();

      setNewTodo("");
      setDueDate("");
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleDeleteTodo = async (id: any) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  // UI for red flag if overdue
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>
        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-lg focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <input
            type="date"
            className="p-3 focus:outline-none text-gray-700"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-lg hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
        <ul>
          {Array.isArray(todos) &&
            todos.map((todo: Todo) => (
              <li
                key={todo.id}
                className="flex justify-between items-center bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
              >
                <div className="flex-grow">
                  <span className="text-gray-800">{todo.title}</span>
                  {todo.dueDate && (
                    <span
                      className={`block text-sm ${
                        isOverdue(todo.dueDate)
                          ? "text-red-600 font-semibold"
                          : "text-gray-600"
                      }`}
                    >
                      Due: {new Date(todo.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 transition duration-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
