"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { IconPicker } from "./IconPicker";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type TemplateNode = {
  type: "text" | "link" | "checklist";
  content: string;
  title?: string;
  position: { x: number; y: number };
};

type BoardTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  nodes: TemplateNode[];
};

const TEMPLATES: BoardTemplate[] = [
  {
    id: "blank",
    name: "Blank Board",
    icon: "📋",
    description: "Start with an empty canvas",
    nodes: [],
  },
  {
    id: "project-tracker",
    name: "Project Tracker",
    icon: "🎯",
    description: "Track tasks, links, and progress",
    nodes: [
      {
        type: "checklist",
        content: JSON.stringify([
          { id: "t1", text: "Define project scope", checked: false },
          { id: "t2", text: "Set up repository", checked: false },
          { id: "t3", text: "Create initial design", checked: false },
          { id: "t4", text: "Build MVP", checked: false },
          { id: "t5", text: "Write tests", checked: false },
        ]),
        title: "Tasks",
        position: { x: 100, y: 100 },
      },
      {
        type: "checklist",
        content: JSON.stringify([
          { id: "m1", text: "Milestone 1: Prototype", checked: false },
          { id: "m2", text: "Milestone 2: Beta launch", checked: false },
          { id: "m3", text: "Milestone 3: Public release", checked: false },
        ]),
        title: "Milestones",
        position: { x: 100, y: 380 },
      },
      {
        type: "text",
        content: "Project goals and key decisions go here. Update as the project evolves.",
        title: "Notes",
        position: { x: 420, y: 100 },
      },
      {
        type: "link",
        content: "https://github.com",
        position: { x: 420, y: 300 },
      },
    ],
  },
  {
    id: "event-plan",
    name: "Event Plan",
    icon: "🎉",
    description: "Plan an event with tasks and resources",
    nodes: [
      {
        type: "checklist",
        content: JSON.stringify([
          { id: "e1", text: "Book venue", checked: false },
          { id: "e2", text: "Send invitations", checked: false },
          { id: "e3", text: "Arrange catering", checked: false },
          { id: "e4", text: "Set up AV equipment", checked: false },
          { id: "e5", text: "Prepare agenda", checked: false },
        ]),
        title: "To-do",
        position: { x: 100, y: 100 },
      },
      {
        type: "text",
        content: "Event date, venue address, and key contacts go here.",
        title: "Event Details",
        position: { x: 420, y: 100 },
      },
      {
        type: "link",
        content: "https://calendar.google.com",
        position: { x: 420, y: 300 },
      },
    ],
  },
  {
    id: "engineering",
    name: "Engineering Tasks",
    icon: "🏗️",
    description: "Track bugs, features, and tech debt",
    nodes: [
      {
        type: "checklist",
        content: JSON.stringify([
          { id: "f1", text: "Feature: User authentication", checked: false },
          { id: "f2", text: "Feature: Dashboard redesign", checked: false },
          { id: "f3", text: "Bug: Fix login redirect", checked: false },
        ]),
        title: "Sprint Backlog",
        position: { x: 100, y: 100 },
      },
      {
        type: "checklist",
        content: JSON.stringify([
          { id: "d1", text: "Refactor API layer", checked: false },
          { id: "d2", text: "Update dependencies", checked: false },
        ]),
        title: "Tech Debt",
        position: { x: 100, y: 380 },
      },
      {
        type: "text",
        content: "Architecture decisions, API docs, and deployment notes.",
        title: "Engineering Notes",
        position: { x: 420, y: 100 },
      },
      {
        type: "link",
        content: "https://github.com",
        position: { x: 420, y: 300 },
      },
    ],
  },
  {
    id: "brand-tone",
    name: "Brand Tone of Voice",
    icon: "🎨",
    description: "Define brand personality and guidelines",
    nodes: [
      {
        type: "text",
        content: "Our brand voice is friendly, professional, and approachable. We speak to our audience as peers, not down to them.",
        title: "Voice & Tone",
        position: { x: 100, y: 100 },
      },
      {
        type: "text",
        content: "Do: Use active voice, be concise, lead with benefits.\nDon't: Use jargon, be condescending, over-promise.",
        title: "Do's & Don'ts",
        position: { x: 100, y: 300 },
      },
      {
        type: "checklist",
        content: JSON.stringify([
          { id: "b1", text: "Website copy review", checked: false },
          { id: "b2", text: "Social media templates", checked: false },
          { id: "b3", text: "Email tone guidelines", checked: false },
        ]),
        title: "Content Checklist",
        position: { x: 420, y: 100 },
      },
      {
        type: "link",
        content: "https://fonts.google.com",
        position: { x: 420, y: 350 },
      },
    ],
  },
];

export function CreateBoardDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📋");
  const [visibility, setVisibility] = useState<"private" | "shared" | "public">("private");
  const [selectedTemplate, setSelectedTemplate] = useLocalStorage("dump-last-template", "project-tracker");
  const [step, setStep] = useState<"template" | "details">("template");
  const createBoard = useMutation(api.boards.createBoard);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setStep("template");
      setName("");
      const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);
      setIcon(tpl?.icon ?? "📋");
    }
  }, [open, selectedTemplate]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const tpl = TEMPLATES.find((t) => t.id === templateId)!;
    setIcon(tpl.icon);
    if (!name) setName(tpl.id === "blank" ? "" : tpl.name);
    setStep("details");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const tpl = TEMPLATES.find((t) => t.id === selectedTemplate);
    const templateNodes = tpl && tpl.nodes.length > 0 ? tpl.nodes : undefined;
    const slug = await createBoard({
      name: name.trim(),
      icon,
      visibility,
      templateNodes,
    });
    setOpen(false);
    setName("");
    setIcon("📋");
    setVisibility("private");
    router.push(`/b/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New Board
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "template" ? "Choose a template" : "Create Board"}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? (
          <div className="space-y-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selectedTemplate === tpl.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <span className="text-xl flex-shrink-0">{tpl.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">{tpl.description}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                placeholder="My Context Board"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Visibility</label>
              <div className="flex gap-2">
                {(["private", "shared", "public"] as const).map((v) => (
                  <Button
                    key={v}
                    variant={visibility === v ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVisibility(v)}
                    className="capitalize"
                  >
                    {v}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("template")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreate} disabled={!name.trim()} className="flex-1">
                Create
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
