import {
  LayoutDashboard,
  Building2,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  UserCheck,
  ShieldAlert,
  ListChecks,
  CalendarRange,
  CalendarDays,
  Users,
  Megaphone,
  FileText,
  History,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { Permission } from '@openregistro/core';

export interface NavItem {
  href: string;
  label: string;
  permission: Permission;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', permission: 'register:read', icon: LayoutDashboard },
  { href: '/dashboard/school', label: 'School', permission: 'records:manage', icon: Building2 },
  {
    href: '/dashboard/register',
    label: 'Register',
    permission: 'register:write',
    icon: ClipboardCheck,
  },
  { href: '/dashboard/gradebook', label: 'Gradebook', permission: 'grades:write', icon: BookOpen },
  { href: '/dashboard/grades', label: 'Grades', permission: 'grades:read', icon: GraduationCap },
  {
    href: '/dashboard/attendance',
    label: 'Attendance',
    permission: 'attendance:read',
    icon: UserCheck,
  },
  {
    href: '/dashboard/discipline',
    label: 'Discipline',
    permission: 'register:read',
    icon: ShieldAlert,
  },
  { href: '/dashboard/homework', label: 'Homework', permission: 'homework:read', icon: ListChecks },
  {
    href: '/dashboard/timetable',
    label: 'Timetable',
    permission: 'calendar:read',
    icon: CalendarRange,
  },
  {
    href: '/dashboard/calendar',
    label: 'Calendar',
    permission: 'calendar:read',
    icon: CalendarDays,
  },
  { href: '/dashboard/meetings', label: 'Meetings', permission: 'calendar:read', icon: Users },
  {
    href: '/dashboard/announcements',
    label: 'Announcements',
    permission: 'announcements:read',
    icon: Megaphone,
  },
  {
    href: '/dashboard/report-cards',
    label: 'Report cards',
    permission: 'reports:read',
    icon: FileText,
  },
  { href: '/dashboard/audit-log', label: 'Audit log', permission: 'audit:read', icon: History },
];
