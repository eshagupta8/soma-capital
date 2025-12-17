"use client";
import { useEffect, useRef } from "react";

interface Todo {
  id: number;
  title: string;
  duration: number;
  dependencyIds: string | null;
  isOnCriticalPath: boolean;
}

interface DependencyGraphProps {
  todos: Todo[];
}

export default function DependencyGraph({ todos }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawGraph();
  }, [todos]);

  const getDependencies = (todo: Todo): number[] => {
    if (!todo.dependencyIds) return [];
    try {
      return JSON.parse(todo.dependencyIds);
    } catch {
      return [];
    }
  };

  const getDependents = (todo: Todo): number[] => {
    return todos
      .filter((t) => {
        const deps = getDependencies(t);
        return deps.includes(todo.id);
      })
      .map((t) => t.id);
  };

  // Get all related tasks (dependencies and dependents)
  const getAllRelatedTaskIds = (startTaskId: number): Set<number> => {
    const related = new Set<number>();
    const visited = new Set<number>();

    const traverse = (taskId: number) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);
      related.add(taskId);

      const task = todos.find((t) => t.id === taskId);
      if (!task) return;

      // Get dependencies (upstream)
      const deps = getDependencies(task);
      deps.forEach(traverse);

      // Get dependents (downstream)
      const dependents = getDependents(task);
      dependents.forEach(traverse);
    };

    traverse(startTaskId);
    return related;
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the selected task (first one in the list for this modal)
    const selectedTaskId = todos[0]?.id;
    if (!selectedTaskId) return;

    // Get all related tasks
    const relatedTaskIds = getAllRelatedTaskIds(selectedTaskId);
    const relatedTodos = todos.filter((t) => relatedTaskIds.has(t.id));

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Layout: position nodes in levels based on dependencies
    const levels: number[][] = [];
    const nodePositions = new Map<number, { x: number; y: number }>();

    // Calculate levels (topological sort by depth)
    function getLevel(todoId: number, visited = new Set<number>()): number {
      if (visited.has(todoId)) return 0;
      visited.add(todoId);

      const todo = relatedTodos.find((t) => t.id === todoId);
      if (!todo) return 0;

      const deps = getDependencies(todo).filter((id) => relatedTaskIds.has(id));
      if (deps.length === 0) return 0;

      let maxDepLevel = -1;
      for (const depId of deps) {
        maxDepLevel = Math.max(maxDepLevel, getLevel(depId, new Set(visited)));
      }
      return maxDepLevel + 1;
    }

    // Organize todos by level
    for (const todo of relatedTodos) {
      const level = getLevel(todo.id);
      if (!levels[level]) levels[level] = [];
      levels[level].push(todo.id);
    }

    // Calculate positions
    const nodeWidth = 140;
    const nodeHeight = 60;
    const levelGap = 150;
    const nodeGap = 20;

    levels.forEach((levelTodos, levelIndex) => {
      const levelWidth = levelTodos.length * (nodeWidth + nodeGap);
      const startX = (canvas.width - levelWidth) / 2;

      levelTodos.forEach((todoId, index) => {
        const x = startX + index * (nodeWidth + nodeGap) + nodeWidth / 2;
        const y = 60 + levelIndex * levelGap;
        nodePositions.set(todoId, { x, y });
      });
    });

    // Draw connections (arrows) - from dependencies to dependents
    for (const todo of relatedTodos) {
      const deps = getDependencies(todo).filter((id) => relatedTaskIds.has(id));
      const toPos = nodePositions.get(todo.id);
      if (!toPos) continue;

      for (const depId of deps) {
        const fromPos = nodePositions.get(depId);
        if (!fromPos) continue;

        // Determine if this edge is on critical path
        const fromTodo = relatedTodos.find((t) => t.id === depId);
        const isOnCriticalPath =
          todo.isOnCriticalPath && fromTodo?.isOnCriticalPath;

        ctx.strokeStyle = isOnCriticalPath ? "#F59E0B" : "#CBD5E0";
        ctx.lineWidth = isOnCriticalPath ? 3 : 2;

        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y + nodeHeight / 2);
        ctx.lineTo(toPos.x, toPos.y - nodeHeight / 2);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(
          toPos.y - nodeHeight / 2 - (fromPos.y + nodeHeight / 2),
          toPos.x - fromPos.x
        );
        const arrowSize = 10;
        ctx.beginPath();
        ctx.moveTo(toPos.x, toPos.y - nodeHeight / 2);
        ctx.lineTo(
          toPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
          toPos.y - nodeHeight / 2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toPos.x, toPos.y - nodeHeight / 2);
        ctx.lineTo(
          toPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
          toPos.y - nodeHeight / 2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const todo of relatedTodos) {
      const pos = nodePositions.get(todo.id);
      if (!pos) continue;

      const x = pos.x - nodeWidth / 2;
      const y = pos.y - nodeHeight / 2;

      const isSelected = todo.id === selectedTaskId;

      // Node background
      ctx.fillStyle = isSelected
        ? "#DBEAFE"
        : todo.isOnCriticalPath
        ? "#FEF3C7"
        : "#FFFFFF";
      ctx.strokeStyle = isSelected
        ? "#3B82F6"
        : todo.isOnCriticalPath
        ? "#F59E0B"
        : "#CBD5E0";
      ctx.lineWidth = isSelected ? 4 : todo.isOnCriticalPath ? 3 : 2;

      // Draw rounded rectangle
      const radius = 8;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + nodeWidth - radius, y);
      ctx.quadraticCurveTo(x + nodeWidth, y, x + nodeWidth, y + radius);
      ctx.lineTo(x + nodeWidth, y + nodeHeight - radius);
      ctx.quadraticCurveTo(
        x + nodeWidth,
        y + nodeHeight,
        x + nodeWidth - radius,
        y + nodeHeight
      );
      ctx.lineTo(x + radius, y + nodeHeight);
      ctx.quadraticCurveTo(x, y + nodeHeight, x, y + nodeHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Node text
      ctx.fillStyle = "#1F2937";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Title (truncate if too long)
      const maxWidth = nodeWidth - 10;
      let title = todo.title;
      if (ctx.measureText(title).width > maxWidth) {
        while (
          ctx.measureText(title + "...").width > maxWidth &&
          title.length > 0
        ) {
          title = title.slice(0, -1);
        }
        title += "...";
      }

      ctx.fillText(title, pos.x, pos.y - 8);

      // Duration
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#6B7280";
      ctx.fillText(
        `${todo.duration} day${todo.duration !== 1 ? "s" : ""}`,
        pos.x,
        pos.y + 12
      );
    }
  };

  // Calculate canvas height based on number of levels
  const getLevels = () => {
    if (todos.length === 0) return 0;

    const selectedTaskId = todos[0]?.id;
    if (!selectedTaskId) return 0;

    const relatedTaskIds = getAllRelatedTaskIds(selectedTaskId);
    const relatedTodos = todos.filter((t) => relatedTaskIds.has(t.id));

    const levels: number[][] = [];
    function getLevel(todoId: number, visited = new Set<number>()): number {
      if (visited.has(todoId)) return 0;
      visited.add(todoId);

      const todo = relatedTodos.find((t) => t.id === todoId);
      if (!todo) return 0;
      const deps = getDependencies(todo).filter((id) => relatedTaskIds.has(id));
      if (deps.length === 0) return 0;
      let maxDepLevel = -1;
      for (const depId of deps) {
        maxDepLevel = Math.max(maxDepLevel, getLevel(depId, new Set(visited)));
      }
      return maxDepLevel + 1;
    }
    for (const todo of relatedTodos) {
      const level = getLevel(todo.id);
      if (!levels[level]) levels[level] = [];
      levels[level].push(todo.id);
    }
    return levels.length;
  };

  const numLevels = getLevels();
  const canvasHeight = Math.max(400, 60 + numLevels * 150 + 60);

  return (
    <div className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg mb-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Upstream Dependency Chain
      </h2>
      {todos.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No tasks to display</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <canvas ref={canvasRef} width={800} height={canvasHeight} />
          </div>
        </>
      )}
    </div>
  );
}
