import { CalendarCheck, MessageSquare, CheckCircle2, Wrench } from 'lucide-react';

export const ADMISSION_DIAGNOSTIC_STAGES = [
  {
    key: "evaluation_scheduled",
    title: "Appointment Scheduled",
    icon: CalendarCheck,
    colorClass: "text-blue-500",
    borderColor: "border-blue-500",
  },
  {
    key: "waiting_customer",
    title: "Waiting Customer Confirmation",
    icon: MessageSquare,
    colorClass: "text-purple-500",
    borderColor: "border-purple-500",
  },
  {
    key: "appointment_confirmed",
    title: "Appointment Confirmed",
    icon: CheckCircle2,
    colorClass: "text-emerald-500",
    borderColor: "border-emerald-500",
  },
  {
    key: "evaluating_and_quoting",
    title: "Appointment Executed",
    icon: Wrench,
    colorClass: "text-cyan-500",
    borderColor: "border-cyan-500",
  }
];
