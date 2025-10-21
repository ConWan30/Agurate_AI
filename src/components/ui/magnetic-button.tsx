import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const magneticButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:scale-105",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline",
        magnetic: "bg-primary text-primary-foreground magnetic hover:shadow-glow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof magneticButtonVariants> {
  asChild?: boolean;
  enableRipple?: boolean;
}

const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ className, variant, size, asChild = false, enableRipple = true, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

    React.useImperativeHandle(ref, () => buttonRef.current!);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant !== "magnetic") return;
      
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 50;

      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const translateX = x * strength * 0.3;
        const translateY = y * strength * 0.3;

        button.style.transform = `translate(${translateX}px, ${translateY}px)`;
      }
    };

    const handleMouseLeave = () => {
      if (buttonRef.current) {
        buttonRef.current.style.transform = "";
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!enableRipple) {
        props.onClick?.(e);
        return;
      }

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = { x, y, id: Date.now() };
      setRipples((prev) => [...prev, ripple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);

      props.onClick?.(e);
    };

    return (
      <Comp
        className={cn(magneticButtonVariants({ variant, size, className }))}
        ref={buttonRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        {props.children}
        {enableRipple && ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </Comp>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

export { MagneticButton, magneticButtonVariants };
