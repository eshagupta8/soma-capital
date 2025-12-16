"use client";
import { Todo } from "@prisma/client";
import { useState, useEffect } from "react";

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsLoading(false); // Add this
    }
  };

  /* adds Todo item to the existing list, renders a loading symbol while
   * generating
   */
  const handleAddTodo = async () => {
    if (!newTodo.trim()) return; // handle empty string, trim formatting
    setIsCreating(true);
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
    } finally {
      setIsCreating(false);
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

  // UI for red overlay if overdue items
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // loads in new Image to display
  const handleImageLoad = (id: number) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  // Loading symbol if images are still generating on front-end
  const handleImageLoadStart = (id: number) => {
    setLoadingImages((prev) => new Set(prev).add(id));
  };

  // ToDo Item UI

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
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
            disabled={isCreating}
          />
          <input
            type="date"
            className="p-3 focus:outline-none text-gray-700"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isCreating}
          />
          <button
            onClick={handleAddTodo}
            disabled={isCreating}
            className="bg-white text-indigo-600 p-3 rounded-r-lg hover:bg-gray-100 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Adding..." : "Add"}
          </button>
        </div>
        {isCreating && (
          <div className="bg-white bg-opacity-90 p-6 mb-4 rounded-lg shadow-lg text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        ) : (
          <ul>
            {Array.isArray(todos) &&
              todos.map((todo: Todo) => (
                <li
                  key={todo.id}
                  className="bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg"
                >
                  <div className="flex gap-4 items-center">
                    {/* Left side: Text content */}
                    <div className="flex-grow flex flex-col justify-center">
                      <span className="text-gray-800 font-medium">
                        {todo.title}
                      </span>
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
                    {/* Middle: Square image */}
                    {todo.imageUrl && (
                      <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        {loadingImages.has(todo.id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                          </div>
                        )}
                        <img
                          src={todo.imageUrl}
                          alt={todo.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onLoadStart={() => handleImageLoadStart(todo.id)}
                          onLoad={() => handleImageLoad(todo.id)}
                          onError={() => handleImageLoad(todo.id)}
                        />
                      </div>
                    )}

                    {/* Right side: Delete button */}
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
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
