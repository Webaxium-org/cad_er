import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function useHardBackLock(enabled = true) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    const pushStates = () => {
      for (let i = 0; i < 5; i++) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    pushStates();

    const onPopState = () => {
      pushStates();
      navigate(location.pathname, { replace: true });
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled, navigate, location.pathname]);
}
