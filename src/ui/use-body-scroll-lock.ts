import * as React from "react";

let lockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyPaddingRight = "";

function lockBodyScroll() {
  if (lockCount === 0) {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  lockCount += 1;
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
  }
}

function useBodyScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) {
      return;
    }

    lockBodyScroll();
    return unlockBodyScroll;
  }, [locked]);
}

export { useBodyScrollLock };
