interface Todo {
  id: number;
  title: string;
  duration: number;
  dependencyIds: string | null;
  dueDate: Date | null;
  earliestStart: Date | null;
}

// Parse dependency IDs from JSON string (assuming data stored correctly)
// @params: todo item to call from
export function getDependencyIds(todo: Todo): number[] {
  if (!todo.dependencyIds) return [];
  try {
    return JSON.parse(todo.dependencyIds);
  } catch {
    return [];
  }
}

// Check for circular dependencies using DFS
export function hasCircularDependency(
  taskId: number,
  newDependencyId: number,
  allTodos: Todo[]
): boolean {
  const visited = new Set<number>();

  // quick DFS search to see if dependency chain loops in a cycle
  function dfs(currentId: number): boolean {
    if (currentId === taskId) return true; // Found a cycle
    if (visited.has(currentId)) return false;

    visited.add(currentId);

    const currentTodo = allTodos.find((t) => t.id === currentId);
    if (!currentTodo) return false;

    const deps = getDependencyIds(currentTodo);
    for (const depId of deps) {
      if (dfs(depId)) return true;
    }

    return false;
  }

  return dfs(newDependencyId);
}

// Calculate earliest start dates for all tasks
export function calculateEarliestStarts(todos: Todo[]): Map<number, Date> {
  const earliestStarts = new Map<number, Date>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function calculateStart(todoId: number, visited = new Set<number>()): Date {
    if (earliestStarts.has(todoId)) {
      return earliestStarts.get(todoId)!;
    }

    if (visited.has(todoId)) {
      return today;
    }

    visited.add(todoId);

    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return today;

    const deps = getDependencyIds(todo);

    // If no dependencies, can start today
    if (deps.length === 0) {
      earliestStarts.set(todoId, today);
      return today;
    }

    // Find the latest finish date of all dependencies
    let latestFinish = today;

    for (const depId of deps) {
      const depTodo = todos.find((t) => t.id === depId);
      if (!depTodo) continue;

      const depStart = calculateStart(depId, new Set(visited));
      const depFinish = new Date(depStart);
      depFinish.setDate(depFinish.getDate() + depTodo.duration);

      if (depFinish > latestFinish) {
        latestFinish = depFinish;
      }
    }

    earliestStarts.set(todoId, latestFinish);
    return latestFinish;
  }

  // Calculate for all todos
  for (const todo of todos) {
    calculateStart(todo.id);
  }

  return earliestStarts;
}

// Calculate critical path
export function calculateCriticalPath(todos: Todo[]): Set<number> {
  const criticalPath = new Set<number>();

  // Calculate path lengths (total duration from start to each task)
  function getPathLength(todoId: number, visited = new Set<number>()): number {
    if (visited.has(todoId)) return 0;
    visited.add(todoId);

    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return 0;

    const deps = getDependencyIds(todo);
    if (deps.length === 0) {
      return todo.duration;
    }

    let maxDepPath = 0;
    for (const depId of deps) {
      const depPath = getPathLength(depId, new Set(visited));
      maxDepPath = Math.max(maxDepPath, depPath);
    }

    return maxDepPath + todo.duration;
  }

  // Find the task(s) with the longest path
  let maxLength = 0;
  let endTasks: number[] = [];

  for (const todo of todos) {
    const pathLength = getPathLength(todo.id);
    if (pathLength > maxLength) {
      maxLength = pathLength;
      endTasks = [todo.id];
    } else if (pathLength === maxLength) {
      endTasks.push(todo.id);
    }
  }

  // Trace back the critical path
  function tracePath(todoId: number) {
    criticalPath.add(todoId);

    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;

    const deps = getDependencyIds(todo);
    if (deps.length === 0) return;

    // Find the dependency with the longest path
    let longestDepId = deps[0];
    let longestPath = getPathLength(longestDepId);

    for (const depId of deps) {
      const pathLen = getPathLength(depId);
      if (pathLen > longestPath) {
        longestPath = pathLen;
        longestDepId = depId;
      }
    }

    tracePath(longestDepId);
  }

  for (const endTask of endTasks) {
    tracePath(endTask);
  }

  return criticalPath;
}
