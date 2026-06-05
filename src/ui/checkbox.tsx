import * as React from "react";

import { cn } from "./utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--primary)] focus:ring-2 focus:ring-pink-100 focus:ring-offset-0",
        className,
      )}
    />
  );
}

export { Checkbox };
