"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";

export function CommunicationTemplates() {
  const [templates, setTemplates] = useState([
    {
      id: "template-1",
      name: "Policy Renewal Reminder",
      type: "Email",
      subject: "Your Insurance Policy is Due for Renewal",
      content:
        "Dear {{client_name}},\n\nYour {{policy_type}} insurance policy #{{policy_number}} is due for renewal on {{renewal_date}}.\n\nPlease contact us to discuss your renewal options.\n\nRegards,\n{{agent_name}}",
      variables: ["client_name", "policy_type", "policy_number", "renewal_date", "agent_name"],
    },
    {
      id: "template-2",
      name: "Payment Confirmation",
      type: "SMS",
      subject: "Payment Received",
      content:
        "Thank you {{client_name}}! We've received your payment of {{amount}} for {{policy_type}} policy #{{policy_number}}. Receipt #{{receipt_number}}.",
      variables: ["client_name", "amount", "policy_type", "policy_number", "receipt_number"],
    },
    {
      id: "template-3",
      name: "Claim Status Update",
      type: "Email",
      subject: "Update on Your Insurance Claim",
      content:
        "Dear {{client_name}},\n\nWe're writing to inform you that your claim #{{claim_number}} has been {{claim_status}}.\n\n{{additional_details}}\n\nIf you have any questions, please don't hesitate to contact us.\n\nRegards,\n{{agent_name}}",
      variables: ["client_name", "claim_number", "claim_status", "additional_details", "agent_name"],
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templates)[0] | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Available Templates</h3>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription>{template.type}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-xs font-medium text-muted-foreground mb-1">Subject:</div>
              <p className="text-sm mb-2">{template.subject}</p>
              <div className="text-xs font-medium text-muted-foreground mb-1">Content Preview:</div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">{template.content}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="w-full">
                <div className="text-xs font-medium text-muted-foreground mb-1">Variables:</div>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
                    >
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <div className="border rounded-md p-4 mt-6">
          <h3 className="text-lg font-medium mb-4">Edit Template</h3>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input id="template-name" defaultValue={selectedTemplate.name} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template-subject">Subject</Label>
              <Input id="template-subject" defaultValue={selectedTemplate.subject} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="template-content">Content</Label>
              <textarea
                id="template-content"
                rows={6}
                defaultValue={selectedTemplate.content}
                className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Cancel
              </Button>
              <Button>Save Changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
