import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: [
        // Order by recent due dates first
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

    const { title, dueDate } = body;

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("API: Error creating todo:", error);
    return NextResponse.json({ error: "Error creating todo" }, { status: 500 });
  }
}
