"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

export function ChatView() {
  const isMobile = useIsMobile();
  // INFO: This ensures the page is fully loaded before the this components renders.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    function handleMounted() {
      setHasMounted(true);
    }
    handleMounted();
  }, []);
  if (!hasMounted || isMobile === undefined) {
    return null;
  }

  // INFO: Check if user is on a mobile device or a bigger screen.
  if (isMobile) {
    return <div></div>;
  } else {
    return <div></div>;
  }
}
