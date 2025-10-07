import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";

// Utility function for merging classes
export function cn(...inputs: any[]) {
  return clsx(inputs);
}

// Design tokens
export const colors = {
  primary: '#63bb33',
  primaryDark: '#529f27',
  background: '#000000',
  backgroundSecondary: '#111111',
  text: '#ffffff',
  textSecondary: '#d1d5db',
  textMuted: '#6b7280',
  border: '#374151',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981'
};

// Button component
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-black hover:bg-primary/90",
        destructive: "bg-red-500 text-white hover:bg-red-500/90",
        outline: "border border-primary text-primary hover:bg-primary hover:text-black",
        secondary: "bg-gray-800 text-white hover:bg-gray-700",
        ghost: "hover:bg-gray-800 text-white",
        terminal: "bg-gradient-to-r from-primary/20 to-primaryDark/20 border-2 border-primary/60 text-primary hover:border-primary font-mono"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// Card component
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-gray-700 bg-gray-900 text-white shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-primary",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Terminal-style components
export const TerminalCard = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border-2 border-primary/40 bg-gradient-to-br from-gray-900 to-gray-800 shadow-lg shadow-primary/10 relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primaryDark/10 animate-pulse opacity-50" />
      <div className="relative z-10">{props.children}</div>
    </div>
  )
);
TerminalCard.displayName = "TerminalCard";

// Status indicator
export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'pending' | 'error';
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label }) => {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    pending: 'bg-yellow-500',
    error: 'bg-red-600'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full animate-pulse", statusColors[status])} />
      {label && (
        <span className={cn("text-sm font-mono", {
          'text-green-400': status === 'online',
          'text-red-400': status === 'offline' || status === 'error',
          'text-yellow-400': status === 'pending'
        })}>
          {label}
        </span>
      )}
    </div>
  );
};

// Loading spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size])} />
  );
};

// Export all components
export * from "./components/navigation";
export * from "./components/forms";