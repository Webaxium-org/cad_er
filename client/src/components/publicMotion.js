// Shared entrance motion for public page headers and content cards.
export const publicHeroMotion = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: "easeOut" },
};

export const publicCardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

export const publicCardVariants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15, duration: 0.8 },
  },
};
