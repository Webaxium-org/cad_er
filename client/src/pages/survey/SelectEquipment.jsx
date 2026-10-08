import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Stack,
  Typography,
  useMediaQuery,
  Paper,
  Container,
} from "@mui/material";
import Lottie from "lottie-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { stopLoading } from "../../redux/loadingSlice";
import { useEffect, useRef, useState } from "react";
import BasicButton from "../../components/BasicButton";
import { heroTitleSx, compactTitleSx } from "../../components/pageHeaderStyles";
import { GoAlert } from "react-icons/go";
import { IoCheckmarkCircle } from "react-icons/io5";
import autoLevelIcon from "../../assets/icons/compass.json";
import totalStationIcon from "../../assets/total-station.png";
import DGPSIcon from "../../assets/icons/GPS Navigation.json";
import DroneIcon from "../../assets/icons/Drone Camera.json";
import BathymetryIcon from "../../assets/icons/Boat-Looking-For-Land.json";
import { FaLocationArrow } from "react-icons/fa";
import { FiCompass } from "react-icons/fi";
import SmallHeader from "../../components/SmallHeader";
import { showAlert } from "../../redux/alertSlice";

const equipmentList = [
  {
    label: "Auto Level",
    icon: autoLevelIcon,
    link: "#",
    color: "#6366f1",
    size: 12,
  },
  {
    label: "Total Station",
    icon: totalStationIcon,
    link: "#",
    color: "#0ea5e9",
  },
  {
    label: "DGPS",
    icon: DGPSIcon,
    link: "#",
    color: "#f59e0b",
  },
  {
    label: "Drone",
    icon: DroneIcon,
    link: "#",
    color: "#8b5cf6",
  },
  {
    label: "Sonar",
    icon: BathymetryIcon,
    link: "#",
    color: "#14b8a6",
  },
];

const SelectEquipment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { global } = useSelector((state) => state.loading || { global: false });

  const [active, setActive] = useState(0);
  const heroRef = useRef(null);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);

  useEffect(() => {
    const updateCompactHeader = () => {
      const halfway = (heroRef.current?.offsetHeight || 0) / 2;
      setCompactHeaderVisible(window.scrollY >= halfway && halfway > 0);
    };
    updateCompactHeader();
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
    window.addEventListener("resize", updateCompactHeader);
    return () => {
      window.removeEventListener("scroll", updateCompactHeader);
      window.removeEventListener("resize", updateCompactHeader);
    };
  }, []);

  const above290 = useMediaQuery("(min-width:290px)");

  const handleChangeActive = (value) => setActive(value);

  const handleSubmit = () => {
    if (active > 0) {
      dispatch(
        showAlert({
          type: "error",
          message: "Work in progress!",
        }),
      );

      return;
    }

    navigate("/survey/add-survey");
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, [dispatch]);

  return (
    <Box
      sx={{ bgcolor: "#f8fafc", minHeight: "100vh", pb: { xs: 20, md: 24 } }}
    >
      <SmallHeader />
      <AnimatePresence>
        {compactHeaderVisible && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            sx={{
              position: "fixed",
              top: { xs: 49, md: 65 },
              left: 0,
              right: 0,
              zIndex: 1099,
              p: 2,
              color: "white",
              background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
              borderRadius: "0 0 20px 20px",
              boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.3)",
            }}
          >
            <Container maxWidth="lg">
              <Stack direction="row" alignItems="center" spacing={2}>
                <FiCompass size={32} opacity={0.9} style={{ flexShrink: 0 }} />
                <Typography fontWeight={900} sx={compactTitleSx} letterSpacing="-0.5px">
                  Select <span style={{ color: "#c7d2fe" }}>Equipment</span>
                </Typography>
              </Stack>
            </Container>
          </Box>
        )}
      </AnimatePresence>
      <Box
        ref={heroRef}
        sx={{
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          pt: 10,
          pb: 10,
          color: "white",
          borderRadius: "0 0 20px 20px",
          boxShadow: "0 10px 40px -10px rgba(79, 70, 229, 0.4)",
          position: "relative",
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              opacity: compactHeaderVisible ? 0 : 1,
              transform: compactHeaderVisible ? "translateY(-12px) scale(0.96)" : "none",
              transformOrigin: "left center",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <FiCompass size={32} opacity={0.9} style={{ flexShrink: 0 }} />
              <Typography variant="h3" sx={heroTitleSx} fontWeight={900} letterSpacing="-0.02em">
                Select <span style={{ color: "#c7d2fe" }}>Equipment</span>
              </Typography>
            </Stack>
            <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 500, fontWeight: 500 }}>
              Choose the primary instrument for your survey.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" sx={{ mt: -8, position: "relative" }}>
        <Stack spacing={3}>
          {equipmentList.map((equipment, idx) => {
            const isActive = idx === active;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Paper
                  elevation={isActive ? 8 : 0}
                  onClick={() => handleChangeActive(idx)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: { xs: 2, md: 3 },
                    borderRadius: "24px",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    transition:
                      "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    bgcolor: "#ffffff",
                    border: isActive
                      ? `2px solid ${equipment.color}`
                      : "2px solid transparent",
                    boxShadow: isActive
                      ? `0 12px 30px -10px ${equipment.color}80`
                      : "0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.04)",
                    "&:hover": {
                      borderColor: isActive ? equipment.color : "#cbd5e1",
                      boxShadow: isActive
                        ? `0 20px 40px -12px ${equipment.color}90`
                        : "0 10px 15px -3px rgba(0,0,0,0.05)",
                    },
                  }}
                >
                  {/* Active Background Tint */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      bgcolor: isActive ? `${equipment.color}0A` : "#f8fafc",
                      transition: "background-color 0.4s ease",
                      zIndex: 0,
                    }}
                  />

                  {/* Icon Box */}
                  <Box
                    sx={{
                      width: { xs: 70, md: 80 },
                      height: { xs: 70, md: 80 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isActive ? `${equipment.color}15` : "#ffffff",
                      borderRadius: "20px",
                      p: 1.5,
                      mr: { xs: 2.5, md: 3 },
                      position: "relative",
                      zIndex: 1,
                      transition:
                        "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      transform: isActive ? "scale(1.05)" : "scale(1)",
                      boxShadow: isActive
                        ? `0 8px 20px -5px ${equipment.color}40`
                        : "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    {equipment.label === "Total Station" ? (
                      <img
                        width="100%"
                        style={{ objectFit: "contain" }}
                        src={equipment.icon}
                        alt={equipment.label}
                      />
                    ) : (
                      <Lottie
                        animationData={equipment.icon}
                        style={{ width: "100%", height: "100%" }}
                      />
                    )}
                  </Box>

                  {/* Text content */}
                  <Box sx={{ flexGrow: 1, position: "relative", zIndex: 1 }}>
                    <Typography
                      fontWeight={900}
                      fontSize={{ xs: "1.1rem", md: "1.25rem" }}
                      color={isActive ? "#1e293b" : "#64748b"}
                      sx={{
                        transition: "color 0.3s ease",
                        letterSpacing: "-0.02em",
                        mb: 0.5,
                      }}
                    >
                      {equipment.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={isActive ? equipment.color : "text.secondary"}
                      fontWeight={700}
                      sx={{
                        opacity: isActive ? 1 : 0.6,
                        fontSize: { xs: "0.75rem", md: "0.85rem" },
                      }}
                    >
                      {isActive ? "Selected Instrument" : "Tap to select"}
                    </Typography>
                  </Box>

                  {/* Radio / Checkmark */}
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      ml: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isActive ? (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IoCheckmarkCircle size={36} color={equipment.color} />
                      </motion.div>
                    ) : (
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "2px solid #cbd5e1",
                          mr: 0.5,
                          transition: "all 0.3s ease",
                        }}
                      />
                    )}
                  </Box>
                </Paper>
              </motion.div>
            );
          })}
        </Stack>
      </Container>

      {/* Floating Action Button purely hovering at the bottom */}
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 24, md: 32 },
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        <Container maxWidth="sm" sx={{ pointerEvents: "none" }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ width: "100%", pointerEvents: "auto" }}
          >
            <BasicButton
              value={
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  justifyContent="center"
                >
                  <FaLocationArrow fontSize="22px" />
                  <Typography
                    fontSize="1.1rem"
                    fontWeight={900}
                    letterSpacing="0.05em"
                  >
                    NEXT
                  </Typography>
                </Stack>
              }
              sx={{
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                color: "white",
                height: "64px",
                borderRadius: "24px",
                border: "none",
                boxShadow: "0 15px 35px -5px rgba(99, 102, 241, 0.5)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)",
                  boxShadow: "0 20px 40px -5px rgba(99, 102, 241, 0.6)",
                },
              }}
              fullWidth={true}
              onClick={handleSubmit}
            />
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
};

export default SelectEquipment;
