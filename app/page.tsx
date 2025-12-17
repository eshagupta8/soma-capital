"use client";
import { useState, useEffect } from "react";
import DependencyGraph from "@/lib/DependencyGraph";

interface Todo {
  id: number;
  title: string;
  dueDate: string | null;
  imageUrl: string | null;
  duration: number;
  dependencyIds: string | null;
  earliestStart: string | null;
  isOnCriticalPath: boolean;
  createdAt: string;
}

export default function Home() {
  const [newTodo, setNewTodo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [duration, setDuration] = useState(1);
  const [selectedDependencies, setSelectedDependencies] = useState<number[]>(
    []
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
  const [selectedTaskForGraph, setSelectedTaskForGraph] = useState<
    number | null
  >(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  // --- DATE HELPER FUNCTION ---
  // This prevents the "one day behind" bug by ignoring the local timezone offset
  const formatLocalDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ).toLocaleDateString();
  };

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTodo,
          dueDate: dueDate || null,
          duration,
          dependencyIds:
            selectedDependencies.length > 0 ? selectedDependencies : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to create todo");
        return;
      }

      setNewTodo("");
      setDueDate("");
      setDuration(1);
      setSelectedDependencies([]);
      await fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();

    // Compare as UTC dates to avoid timezone shifts
    const dueUTC = Date.UTC(
      due.getUTCFullYear(),
      due.getUTCMonth(),
      due.getUTCDate()
    );
    const todayUTC = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return dueUTC < todayUTC;
  };

  const getDependencies = (todo: Todo): Todo[] => {
    if (!todo.dependencyIds) return [];
    try {
      const depIds = JSON.parse(todo.dependencyIds) as number[];
      return depIds
        .map((id) => todos.find((t) => t.id === id))
        .filter((t): t is Todo => t !== undefined);
    } catch {
      return [];
    }
  };

  const getDependencyChain = (
    todoId: number,
    visited = new Set<number>()
  ): Todo[] => {
    if (visited.has(todoId)) return [];
    visited.add(todoId);
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return [];
    const deps = getDependencies(todo);
    const chain: Todo[] = [todo];
    for (const dep of deps) {
      chain.push(...getDependencyChain(dep.id, visited));
    }
    return chain;
  };

  const toggleDependency = (todoId: number) => {
    setSelectedDependencies((prev) =>
      prev.includes(todoId)
        ? prev.filter((id) => id !== todoId)
        : [...prev, todoId]
    );
  };

  const handleImageLoad = (id: number) => {
    setLoadingImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleImageLoadStart = (id: number) => {
    setLoadingImages((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>

        {/* Add Todo Form */}
        <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg mb-6">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="flex-grow p-3 rounded-lg focus:outline-none text-gray-700"
              placeholder="Add a new todo"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              disabled={isCreating}
            />
            <input
              type="date"
              className="p-3 rounded-lg focus:outline-none text-gray-700"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="flex gap-2 mb-3">
            <label className="text-gray-700 font-medium flex items-center gap-2">
              Duration:
              <input
                type="number"
                min="1"
                className="w-20 p-2 rounded-lg focus:outline-none text-gray-700"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                disabled={isCreating}
              />
              <span className="text-sm">days</span>
            </label>
          </div>

          {todos.length > 0 && (
            <div className="mb-3">
              <label className="text-gray-700 font-medium mb-2 block">
                Dependencies:
              </label>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
                {todos.map((todo) => (
                  <label
                    key={todo.id}
                    className="flex items-center gap-2 p-1 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(todo.id)}
                      onChange={() => toggleDependency(todo.id)}
                      disabled={isCreating}
                    />
                    <span className="text-sm text-gray-700">{todo.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddTodo}
            disabled={isCreating}
            className="w-full bg-orange-500 text-white p-3 rounded-lg hover:bg-orange-600 transition"
          >
            {isCreating ? "Adding..." : "Add Todo"}
          </button>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg text-center">Loading...</div>
        ) : (
          <ul>
            {todos.map((todo) => {
              const dependencies = getDependencies(todo);
              return (
                <li
                  key={todo.id}
                  className={`bg-white p-4 mb-4 rounded-lg shadow-lg ${
                    todo.isOnCriticalPath ? "ring-4 ring-yellow-400" : ""
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-800 font-medium">
                          {todo.title}
                        </span>
                        {todo.isOnCriticalPath && (
                          <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded font-semibold">
                            Critical Path
                          </span>
                        )}
                      </div>

                      {/* FIX: Using the formatLocalDate helper */}
                      {todo.dueDate && (
                        <span
                          className={`block text-sm ${
                            isOverdue(todo.dueDate)
                              ? "text-red-600 font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          Due: {formatLocalDate(todo.dueDate)}
                        </span>
                      )}

                      <span className="block text-sm text-gray-600">
                        Duration: {todo.duration} days
                      </span>

                      {todo.earliestStart && (
                        <span className="block text-sm text-blue-600 font-medium">
                          Earliest start: {formatLocalDate(todo.earliestStart)}
                        </span>
                      )}

                      {dependencies.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            Depends on:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dependencies.map((dep) => (
                              <span
                                key={dep.id}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                              >
                                {dep.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedTaskForGraph(todo.id)}
                        className="mt-2 text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition"
                      >
                        View Dependency Graph
                      </button>
                    </div>

                    {todo.imageUrl && (
                      <div className="relative w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        {loadingImages.has(todo.id) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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

                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700"
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
              );
            })}
          </ul>
        )}

        {selectedTaskForGraph !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Dependency Chain:{" "}
                    {todos.find((t) => t.id === selectedTaskForGraph)?.title}
                  </h2>
                  {(() => {
                    const task = todos.find(
                      (t) => t.id === selectedTaskForGraph
                    );
                    if (!task) return null;
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Earliest Start:</span>
                          <span className="font-medium text-indigo-600">
                            {formatLocalDate(task.earliestStart)}
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Due Date:</span>
                            <span
                              className={`font-medium ${
                                isOverdue(task.dueDate)
                                  ? "text-red-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {formatLocalDate(task.dueDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => setSelectedTaskForGraph(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl ml-4"
                >
                  ×
                </button>
              </div>
              <DependencyGraph
                todos={getDependencyChain(selectedTaskForGraph).filter(
                  (v, i, a) => a.findIndex((t) => t.id === v.id) === i
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
