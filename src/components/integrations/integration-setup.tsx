"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function IntegrationSetup() {
  const availableIntegrations = [
    {
      id: "available-1",
      name: "QuickBooks",
      description: "Connect your accounting software for financial reconciliation",
      category: "Accounting",
      setupTime: "5-10 minutes",
      icon: "📊",
    },
    {
      id: "available-2",
      name: "DocuSign",
      description: "Automate document signing processes",
      category: "Documents",
      setupTime: "2-5 minutes",
      icon: "📝",
    },
    {
      id: "available-3",
      name: "Salesforce",
      description: "Synchronize client data with your CRM",
      category: "CRM",
      setupTime: "10-15 minutes",
      icon: "👥",
    },
    {
      id: "available-4",
      name: "Microsoft 365",
      description: "Integrate with calendar, email and Office tools",
      category: "Productivity",
      setupTime: "5-10 minutes",
      icon: "📅",
    },
    {
      id: "available-5",
      name: "Google Workspace",
      description: "Connect Gmail, Calendar, and Drive",
      category: "Productivity",
      setupTime: "5-10 minutes",
      icon: "📧",
    },
    {
      id: "available-6",
      name: "Twilio",
      description: "Enhance SMS and voice communication capabilities",
      category: "Communications",
      setupTime: "5-10 minutes",
      icon: "💬",
    },
    {
      id: "available-7",
      name: "Dropbox",
      description: "Connect cloud storage for document management",
      category: "Storage",
      setupTime: "2-5 minutes",
      icon: "📁",
    },
    {
      id: "available-8",
      name: "Stripe",
      description: "Process payments and manage subscriptions",
      category: "Payments",
      setupTime: "5-10 minutes",
      icon: "💳",
    },
    {
      id: "available-9",
      name: "Zapier",
      description: "Connect with thousands of apps through automation",
      category: "Automation",
      setupTime: "10-15 minutes",
      icon: "⚡",
    },
  ];

  const categories = ["All", "Accounting", "CRM", "Documents", "Payments", "Communications", "Productivity"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button key={category} variant={category === "All" ? "default" : "outline"} size="sm">
            {category}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableIntegrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                  <CardDescription className="text-xs">{integration.category}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span>Setup time: {integration.setupTime}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                Connect
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
