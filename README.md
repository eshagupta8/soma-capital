## Soma Capital Technical Assessment

This is a technical assessment as part of the interview process for Soma Capital.

> [!IMPORTANT]  
> You will need a Pexels API key to complete the technical assessment portion of the application. You can sign up for a free API key at https://www.pexels.com/api/

To begin, clone this repository to your local machine.

## Development

This is a [NextJS](https://nextjs.org) app, with a SQLite based backend, intended to be run with the LTS version of Node.

To run the development server:

```bash
npm i
npm run dev
```

## Task:

Modify the code to add support for due dates, image previews, and task dependencies.

### Part 1: Due Dates

When a new task is created, users should be able to set a due date.

When showing the task list is shown, it must display the due date, and if the date is past the current time, the due date should be in red.

### Part 2: Image Generation

When a todo is created, search for and display a relevant image to visualize the task to be done.

To do this, make a request to the [Pexels API](https://www.pexels.com/api/) using the task description as a search query. Display the returned image to the user within the appropriate todo item. While the image is being loaded, indicate a loading state.

You will need to sign up for a free Pexels API key to make the fetch request.

### Part 3: Task Dependencies

Implement a task dependency system that allows tasks to depend on other tasks. The system must:

1. Allow tasks to have multiple dependencies
2. Prevent circular dependencies
3. Show the critical path
4. Calculate the earliest possible start date for each task based on its dependencies
5. Visualize the dependency graph

## Solution:

The solution implements a due date sort that allows users to enter a due date and have tasks automatically be displayed in ascending order from earliest to latest. Overdue items are displayed in red.
Items are visualized using queries from the Pexels API to dynamically load relevant images in a horizontal layout for the UI. A loading indicator is shown while the system is rendering

Tasks are allowed to have multiple dependencies upon entry. The user can select from their existing task list. On the back-end, a DFS algorithm ensures that there are no circular dependencies and calculates the largest critical path. The path is reflected with all relevant ToDos being highlighted on the display. Based on the dependency chain, each ToDo is given an "Earliest Start Date," which defaults to today's date for overdue or independent tasks. The date has been standardized to UTC time to prevent the "one-day behind" bug. Dependencies are visualized when clicked on via an upstream flow chart implemented on a canvas.

## Demo:

## Future Additions

With more time, future additions to this task include:

1. Edit options for the database
2. Resource leveling to cap and recalculate earliest start dates based on working hours
3. Multi-collaborator lists with user assignment
4. Interactive Gantt chart for dependency visualization
5. Step-by-step view option for critcal paths
6. UI enhancement: pivot away from canvas and opt for a gradient colorscheme throughout
