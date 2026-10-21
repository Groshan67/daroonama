import {
  Activity,
  Brain,
  Bug,
  Droplet,
  Eye,
  FlaskConical,
  HeartPulse,
  Pill,
  Ribbon,
  Shield,
  ShieldCheck,
  Soup,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  droplet: Droplet,
  "heart-pulse": HeartPulse,
  brain: Brain,
  wind: Wind,
  shield: Shield,
  ribbon: Ribbon,
  "shield-check": ShieldCheck,
  stomach: Soup,
  thermometer: Thermometer,
  activity: Activity,
  bug: Bug,
  sun: Sun,
  flask: FlaskConical,
  eye: Eye,
  pill: Pill,
};

export function CategoryIcon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.8,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[name] ?? Pill;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
