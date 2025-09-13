"use client";

export function TasksWidget() {
  const tasks = [
    {
      id: "1",
      title: "Review insurance policy for Client A",
      due: "Today",
      priority: "High",
    },
    {
      id: "2",
      title: "Process payment from Client B",
      due: "Tomorrow",
      priority: "Medium",
    },
    {
      id: "3",
      title: "Send renewal reminder to Client C",
      due: "Sep 15",
      priority: "Low",
    },
    {
      id: "4",
      title: "Update claim documents for Client D",
      due: "Sep 16",
      priority: "Medium",
    },
  ];

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
          <div>
            <p className="font-medium">{task.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Due: {task.due}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  task.priority === "High"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : task.priority === "Medium"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>
          <input type="checkbox" className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}
