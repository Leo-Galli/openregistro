import { useEffect, useState, type ReactNode } from 'react';
import type { ToastActionElement } from '../components/toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

export interface ToastEntry {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'success' | 'destructive';
  open: boolean;
}

type Listener = (toasts: ToastEntry[]) => void;

let memoryState: ToastEntry[] = [];
const listeners: Listener[] = [];

function emit() {
  listeners.forEach((listener) => listener(memoryState));
}

function dismiss(id: string) {
  memoryState = memoryState.map((toast) => (toast.id === id ? { ...toast, open: false } : toast));
  emit();
  setTimeout(() => {
    memoryState = memoryState.filter((toast) => toast.id !== id);
    emit();
  }, 200);
}

export interface ToastInput {
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: 'default' | 'success' | 'destructive';
}

export function toast(input: ToastInput): { id: string; dismiss: () => void } {
  const id = crypto.randomUUID();
  const entry: ToastEntry = { ...input, id, open: true };
  memoryState = [entry, ...memoryState].slice(0, TOAST_LIMIT);
  emit();
  setTimeout(() => dismiss(id), TOAST_REMOVE_DELAY);
  return { id, dismiss: () => dismiss(id) };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>(memoryState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { toasts, toast, dismiss };
}
