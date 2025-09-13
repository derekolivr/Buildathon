"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Zap, Clock, MessageSquare, FileText, CreditCard, ArrowRight } from "lucide-react";

export function WorkflowBuilder() {
  const templates = [
    {
      id: "template-1",
      name: "Policy Renewal",
      description: "Automate the policy renewal process from notification to payment",
      steps: [
        { name: "Send renewal notification", icon: MessageSquare },
        { name: "Generate renewal documents", icon: FileText },
        { name: "Process payment", icon: CreditCard },
        { name: "Update policy status", icon: Zap },
        { name: "Send confirmation", icon: MessageSquare },
      ],
      category: "Insurance",
      timeSaved: "3.5 hrs per renewal",
    },
    {
      id: "template-2",
      name: "Client Onboarding",
      description: "Streamline the process of adding new clients to your business",
      steps: [
        { name: "Collect client information", icon: FileText },
        { name: "Generate welcome documents", icon: FileText },
        { name: "Schedule welcome call", icon: Clock },
        { name: "Send welcome email", icon: MessageSquare },
      ],
      category: "Client Management",
      timeSaved: "2.5 hrs per client",
    },
    {
      id: "template-3",
      name: "Claims Processing",
      description: "Automate the claims handling workflow from submission to resolution",
      steps: [
        { name: "Receive claim notification", icon: MessageSquare },
        { name: "Process claim documents", icon: FileText },
        { name: "Generate claim forms", icon: FileText },
        { name: "Schedule assessment", icon: Clock },
        { name: "Send status updates", icon: MessageSquare },
        { name: "Process settlement", icon: CreditCard },
      ],
      category: "Claims",
      timeSaved: "5 hrs per claim",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm">{step.name}</div>
                    {index < template.steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Zap className="mr-1 h-4 w-4" />
                <span>{template.timeSaved}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Use This Template</Button>
            </CardFooter>
          </Card>
        ))}
        <Card className="flex flex-col items-center justify-center border-dashed p-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Plus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-xl font-medium">Create Custom Workflow</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Design your own custom workflow to automate specific operational tasks
          </p>
          <Button className="mt-6">Create Workflow</Button>
        </Card>
      </div>
    </div>
  );
}
