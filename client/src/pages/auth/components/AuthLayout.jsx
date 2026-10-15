import { AnimatePresence, motion as Motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Link, useLocation, useOutlet } from "react-router-dom";
import AuthBrand from "./AuthBrand";
import authLogo from "../../../assets/logo/cader_logo.png";
import WorkspaceContours from "./WorkspaceContours";
import illustration from "../../../assets/Drone-assisted surveying equipment and crew.png";
import "../signIn.css";
import "../loginPage.css";

function FormTransition({ children, register, reducedMotion }) {
  const isPresent = useIsPresent();
  const direction = register ? 1 : -1;

  return (
    <Motion.div
      className={`auth-form-transition${register ? " register-page" : ""}`}
      inert={!isPresent}
      initial={reducedMotion ? false : { opacity: 0, x: direction * 28, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: direction * -18, filter: "blur(3px)" }}
      transition={{ duration: reducedMotion ? 0 : .24, ease: [.22, 1, .36, 1] }}
    >
      {children}
    </Motion.div>
  );
}

export default function AuthLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();

  return (
    <main className="signin-page login-page">
      <WorkspaceContours className="workspace-contours-page" />
      <Motion.div className="signin-layout" layout={reducedMotion ? false : "size"}
        transition={{ layout: { duration: .38, ease: [.22, 1, .36, 1] } }}>
        <section className="login-illustration-panel" aria-label="Welcome to CADER">
          <WorkspaceContours className="workspace-contours-panel" />
          <Link to="/" className="login-brand" aria-label="CADER home"><AuthBrand iconSrc={authLogo} /></Link>
          <h2>From field observations to precise reports.</h2>
          <p>Your next great project starts here.</p>
          <img className="login-illustration" src={illustration}
            alt="Isometric surveying equipment with a drone, total station, and survey map" />
        </section>
        <div className="auth-form-stage">
          <AnimatePresence initial={false} mode="wait">
            <FormTransition key={pathname} register={pathname === "/register"} reducedMotion={reducedMotion}>
              {outlet}
            </FormTransition>
          </AnimatePresence>
        </div>
      </Motion.div>
    </main>
  );
}
