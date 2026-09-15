"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownMenuContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType>({
  open: false,
  setOpen: () => null,
  triggerRef: { current: null },
  menuRef: { current: null },
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef, menuRef }}>
      <div className="inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef } = React.useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<{
      onClick?: React.MouseEventHandler;
      ref?: React.Ref<HTMLButtonElement>;
    }>;
    return React.cloneElement(childElement, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        childElement.props.onClick?.(e);
        setOpen(!open);
      },
    });
  }

  return (
    <button ref={triggerRef} type="button" onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = "end",
  className,
  children,
}: {
  align?: "start" | "center" | "end";
  className?: string;
  children: React.ReactNode;
}) {
  const { open, triggerRef, menuRef } = React.useContext(DropdownMenuContext);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef?.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuEl = menuRef.current;
    
    const menuWidth = menuEl ? menuEl.offsetWidth : 224;
    const menuHeight = menuEl ? menuEl.offsetHeight : 240;

    let left = rect.right - menuWidth;
    if (align === "start") {
      left = rect.left;
    } else if (align === "center") {
      left = rect.left + (rect.width - menuWidth) / 2;
    }

    // Keep within horizontal viewport boundaries
    if (left < 12) left = 12;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }

    // Smart vertical flip: check space below vs above
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    let top = rect.bottom + window.scrollY + 6;
    if (spaceBelow < menuHeight + 16 && spaceAbove > spaceBelow) {
      // Flip upward
      top = rect.top + window.scrollY - menuHeight - 6;
    }

    setCoords({
      top: Math.max(12 + window.scrollY, top),
      left: left + window.scrollX,
    });
  }, [align, triggerRef, menuRef]);

  React.useLayoutEffect(() => {
    if (open) {
      updatePosition();
      // Double check after DOM render for exact menu dimensions
      const timer = setTimeout(updatePosition, 0);
      return () => clearTimeout(timer);
    }
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handleScrollOrResize = () => {
      updatePosition();
    };
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, updatePosition]);

  if (!open || !mounted || !coords) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 99999,
      }}
      className={cn(
        "min-w-[14rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 text-zinc-950 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 animate-in fade-in-0 zoom-in-95 duration-100",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-3 py-2 text-xs font-bold text-zinc-500", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <div className={cn("-mx-1 my-1 h-px bg-zinc-200 dark:bg-zinc-800", className)} />
  );
}

export function DropdownMenuItem({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { setOpen } = React.useContext(DropdownMenuContext);

  return (
    <div
      role="menuitem"
      tabIndex={0}
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
          setOpen(false);
        }
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-xl px-3 py-2 text-xs font-semibold outline-none transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800",
        className
      )}
    >
      {children}
    </div>
  );
}
