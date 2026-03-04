"use client";

import {
  BookOpen, Brain, Briefcase, Bug, Calendar, Camera, ChartBar, Clock,
  Cloud, Code, Coffee, Compass, CreditCard, Database, FileText, Flame,
  Folder, Gift, Globe, Hammer, Heart, Home, Image, Inbox, Key, Laptop,
  Layers, Layout, Lightbulb, Link, Lock, Mail, Map, MessageCircle,
  Mic, Monitor, Moon, Music, Palette, Paperclip, PenTool, Phone, Plane,
  Rocket, Search, Server, Settings, Shield, ShoppingCart, Star, Sun,
  Target, Terminal, ThumbsUp, Trash2, Trophy, Truck, Tv, Umbrella,
  Upload, Users, Video, Wand2, Wifi, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const LUCIDE_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen, brain: Brain, briefcase: Briefcase, bug: Bug,
  calendar: Calendar, camera: Camera, "chart-bar": ChartBar, clock: Clock,
  cloud: Cloud, code: Code, coffee: Coffee, compass: Compass,
  "credit-card": CreditCard, database: Database, "file-text": FileText,
  flame: Flame, folder: Folder, gift: Gift, globe: Globe, hammer: Hammer,
  heart: Heart, home: Home, image: Image, inbox: Inbox, key: Key,
  laptop: Laptop, layers: Layers, layout: Layout, lightbulb: Lightbulb,
  link: Link, lock: Lock, mail: Mail, map: Map,
  "message-circle": MessageCircle, mic: Mic, monitor: Monitor, moon: Moon,
  music: Music, palette: Palette, paperclip: Paperclip, "pen-tool": PenTool,
  phone: Phone, plane: Plane, rocket: Rocket, search: Search,
  server: Server, settings: Settings, shield: Shield,
  "shopping-cart": ShoppingCart, star: Star, sun: Sun, target: Target,
  terminal: Terminal, "thumbs-up": ThumbsUp, trash: Trash2, trophy: Trophy,
  truck: Truck, tv: Tv, umbrella: Umbrella, upload: Upload, users: Users,
  video: Video, wand: Wand2, wifi: Wifi, zap: Zap,
};

export const EMOJI_OPTIONS = [
  "📋", "🧠", "💡", "🎯", "📌", "🗂️", "📝", "🔮",
  "🚀", "⚡", "🌟", "🎨", "📊", "🔗", "🏗️", "💬",
  "🎉", "🔥", "💎", "🌈", "🎵", "🔒", "📱", "🌍",
  "🍕", "🐱", "🌿", "☕", "🎮", "📸", "✈️", "🏠",
];

interface BoardIconProps {
  icon: string;
  className?: string;
  size?: number;
}

export function BoardIcon({ icon, className, size = 20 }: BoardIconProps) {
  if (icon.startsWith("lucide:")) {
    const name = icon.slice(7);
    const Icon = LUCIDE_ICONS[name];
    if (Icon) return <Icon className={className} size={size} />;
    return <span className={className}>?</span>;
  }
  return <span className={className}>{icon}</span>;
}
