import { authService } from "@/lib/services/authService";
import toast from "react-hot-toast";
import { format } from 'date-fns';

export const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
        toast.error(error);
    }
};

export const formatTime = (date: Date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'HH:mm');
    }
    return format(date, 'dd/MM/yyyy');
  };

  interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
    (...args: Parameters<T>): void;
  }

  export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): DebouncedFunction<T> {
    let timer: NodeJS.Timeout;
    return function (this: unknown, ...args: Parameters<T>) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }