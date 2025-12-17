import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  calculateEarliestStarts,
  calculateCriticalPath,
} from "@/lib/dependencies";

/* Function to fetch image from Pexels for todo item
   @params: query string name for todo item 
 */
async function fetchPexelsImage(query: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=1`,
      {
        headers: {
          Authorization: process.env.PEXELS_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      console.error("Pexels API error:", response.status);
      return null;
    }

    const data = await response.json();

    // Return the first image URL if available
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large;
    }

    return null;
  } catch (error) {
    console.error("Error fetching image from Pexels:", error);
    return null;
  }
}

// Recalculate all derived fields (earliest starts and critical path)
async function recalculateAllTodos() {
  const allTodos = await prisma.todo.findMany();

  // Calculate earliest start dates
  const earliestStarts = calculateEarliestStarts(allTodos);

  // Calculate critical path
  const criticalPath = calculateCriticalPath(allTodos);

  // Update all todos
  for (const todo of allTodos) {
    await prisma.todo.update({
      where: { id: todo.id },
      data: {
        earliestStart: earliestStarts.get(todo.id) || new Date(),
        isOnCriticalPath: criticalPath.has(todo.id),
      },
    });
  }
}

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: [
        {
          dueDate: "asc",
        },
        // Fallback sort
        {
          createdAt: "desc",
        },
      ],
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, dueDate, duration = 1, dependencyIds } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const imageUrl = await fetchPexelsImage(title);

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        imageUrl,
        duration: duration || 1,
        dependencyIds: dependencyIds ? JSON.stringify(dependencyIds) : null,
      },
    });
    // Recalculate earliest starts and critical path
    await recalculateAllTodos();

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("API: Error creating todo:", error);
    return NextResponse.json({ error: "Error creating todo" }, { status: 500 });
  }
}
