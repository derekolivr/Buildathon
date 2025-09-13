"use client";

export function RecentActivity() {
  const activities = [
    {
      id: "1",
      action: "Document Processed",
      description: "Insurance claim form auto-filled for Client A",
      time: "10 mins ago",
      icon: "📄",
    },
    {
      id: "2",
      action: "Payment Received",
      description: "Client B paid $750.00 for policy renewal",
      time: "1 hour ago",
      icon: "💰",
    },
    {
      id: "3",
      action: "Reminder Sent",
      description: "Automated renewal reminder sent to Client C",
      time: "3 hours ago",
      icon: "🔔",
    },
    {
      id: "4",
      action: "Document Generated",
      description: "New policy document created for Client D",
      time: "Yesterday",
      icon: "✅",
    },
    {
      id: "5",
      action: "Voice Note Transcribed",
      description: "Client meeting notes converted to text",
      time: "Yesterday",
      icon: "🎤",
    },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 pb-4 last:pb-0 last:border-0 border-b">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <span role="img" aria-label={activity.action}>
              {activity.icon}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">{activity.action}</p>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
