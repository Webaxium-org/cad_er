import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useHardBackLock(enabled = true) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHandlingPop = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const pushStates = () => {
      // Push a DEEP stack
      for (let i = 0; i < 20; i++) {
        window.history.pushState({ locked: true }, "", window.location.href);
      }
    };

    pushStates();

    const onPopState = (event) => {
      if (isHandlingPop.current) return;
      isHandlingPop.current = true;

      pushStates();
      navigate(location.pathname, { replace: true });

      // Reset guard
      setTimeout(() => {
        isHandlingPop.current = false;
      }, 50);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled, navigate, location.pathname]);
}
