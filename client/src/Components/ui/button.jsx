/* eslint-disable react-refresh/only-export-components -- ui primitive intentionally exports both the component and its `buttonVariants` helper, per shadcn convention */
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn-style button, adapted to the light OneLeet app theme (blue primary).
// `buttonVariants` is exported so react-router <Link>s can be styled as buttons
// without pulling in @radix-ui/react-slot.
const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] cursor-pointer",
    {
        variants: {
            variant: {
                default: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
                outline: "border border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
                secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
                ghost: "text-slate-700 hover:bg-slate-100",
                destructive: "bg-red-600 text-white hover:bg-red-700",
                link: "text-blue-600 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-5 py-2",
                sm: "h-9 px-3",
                lg: "h-12 px-6 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

const Button = React.forwardRef(
    ({ className, variant, size, type = "button", ...props }, ref) => (
        <button
            ref={ref}
            type={type}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
);
Button.displayName = "Button";

export { Button, buttonVariants };
