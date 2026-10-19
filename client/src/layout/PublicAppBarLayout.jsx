import { Box, ThemeProvider } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import LandingAppBar, { publicTheme } from "../components/LandingAppBar";
import LandingFooter from "../components/LandingFooter";
import Lenis from "@studio-freight/lenis";
import { useEffect, useRef } from "react";
import { publicContentWidthSx } from "../components/publicLayoutStyles";

const PublicAppBarLayout = () => {
  const { pathname } = useLocation();
  const lenisRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });
    lenisRef.current = lenis;

    let frameId;
    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }

    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ThemeProvider theme={publicTheme}>
      <Box
        id="main-scroll"
        sx={{ ...publicContentWidthSx, bgcolor: "#fff", minHeight: "100vh", position: "relative" }}
      >
        <LandingAppBar />
        <Outlet />
        <LandingFooter />
      </Box>
    </ThemeProvider>
  );
};

export default PublicAppBarLayout;
