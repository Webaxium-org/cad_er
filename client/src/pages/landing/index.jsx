import { Activity, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Box,
  Grid,
  Stack,
  Button,
  useTheme,
  useMediaQuery,
  Link,
} from "@mui/material";
import {
  AiOutlineWarning,
  AiOutlineCloud,
  AiOutlineLineChart,
} from "react-icons/ai";
import { FaInstagram, FaFacebookF, FaTwitter } from "react-icons/fa";
import { FiTool, FiUsers } from "react-icons/fi";
import { MdDevices } from "react-icons/md";
import LOGO from "../../assets/logo/CADer logo-loader.png";
import LOGO2 from "../../assets/logo/CADer logo-main.png";
import CADER_EQUIPMENT from "../../assets/cader_equipment.png";
import CONTOUR_LINES from "../../assets/contour_lines.png";
import CONTOUR_LINES_2 from "../../assets/contour_lines_2.png";
import ENGINEERS from "../../assets/engineers.jpg";
import ROAD from "../../assets/road.png";
import SURVEYOR from "../../assets/surveyor.png";
import BasicInput from "../../components/BasicInput";

const features = [
  {
    icon: <AiOutlineWarning size={42} />,
    text: "Instant zero error field book generation",
  },
  {
    icon: <FiTool size={42} />,
    text: "Provision to check calibration of autolevel instantly",
  },
  {
    icon: <AiOutlineCloud size={42} />,
    text: "Cloud storage and multi-user",
  },
  {
    icon: <MdDevices size={42} />,
    text: "Use anywhere: Mobile, Tablet, Laptop",
  },
  {
    icon: <FiUsers size={42} />,
    text: "Collaboration options",
  },
  {
    icon: <AiOutlineLineChart size={42} />,
    text: "1-click graph and quantity calculation",
  },
];

const inputData = [
  {
    label: "Name",
    name: "name",
    type: "text",
  },
  {
    label: "Phone",
    name: "phone",
    type: "number",
  },
  {
    label: "Email",
    name: "email",
    type: "email",
  },
  {
    label: "Enter your message",
    name: "message",
    type: "text",
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const containerRef = useRef(null);
  const [tickCount, setTickCount] = useState(0);

  const TICK_WIDTH = 2; // px
  const GAP = 8; // px
  const UNIT = TICK_WIDTH + GAP;

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;

      // ✅ FIX: add GAP once
      setTickCount(Math.floor((width + GAP) / UNIT));
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const handleNavigate = (link) => navigate(link);
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack
            spacing={{ xs: 4, md: 6, lg: 10 }}
            py={{ xs: 2, sm: 4, md: 8, lg: 10 }}
            pl={{ xs: 2, sm: 4, md: 8, lg: 10 }}
            pr={{ xs: 2, sm: 4, md: 8, lg: 2 }}
          >
            <img src={LOGO} alt="CADer" style={{ width: 150 }} />

            <Stack spacing={1}>
              <Typography
                variant="h2"
                sx={{
                  fontSize: {
                    xs: "1.8rem",
                    md: "2.5rem",
                    lg: "3.5rem",
                  },
                  fontWeight: 600,
                }}
              >
                Construction Survey Made Easy
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "1rem",
                    md: "1.25rem",
                  },
                }}
              >
                (Road & Waterways) with CADer
              </Typography>
            </Stack>

            <Box position={"relative"}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "red",
                  borderRadius: 0,
                  py: 2,
                  px: 5,
                  width: "fit-content",
                  textTransform: "none",
                  zIndex: 1,
                }}
                onClick={() => handleNavigate("/login")}
              >
                Get Started
              </Button>

              <Activity mode={isLgDown ? "hidden" : "visible"}>
                <img
                  src={CONTOUR_LINES}
                  alt="contour_lines"
                  style={{
                    width: "610px",
                    position: "absolute",
                    top: 10,
                    left: -350,
                  }}
                />
              </Activity>
            </Box>
          </Stack>
        </Grid>
        <Grid
          size={{ xs: 12, lg: 6 }}
          position={"relative"}
          overflow={"hidden"}
        >
          <img
            src={CONTOUR_LINES}
            alt="contour_lines"
            style={{
              width: "610px",
              position: "absolute",
              top: -135,
              right: -70,
            }}
          />
          <Box
            display={"flex"}
            justifyContent={isLgDown ? "center" : "end"}
            alignItems={"center"}
            p={10}
          >
            <img
              src={CADER_EQUIPMENT}
              alt="equipment"
              style={{
                width: "300px",
                zIndex: 1,
                paddingRight: isLgDown ? 0 : 95,
              }}
            />
          </Box>
        </Grid>
      </Grid>

      <Grid
        container
        spacing={2}
        sx={{
          backgroundColor: "white",
          position: "relative",
          zIndex: 10,
        }}
      >
        <Grid size={{ xs: 12, lg: 6 }} overflow={"hidden"}>
          <img
            src={ROAD}
            alt="road"
            style={{
              width: "100%",
              transform: "translateY(-12.9%) scale(1.1)",
            }}
          />
          <Activity mode={isLgDown ? "hidden" : "visible"}>
            <img
              src={CONTOUR_LINES_2}
              alt="contour_lines"
              style={{
                height: "325px",
                position: "absolute",
                left: 0,
                bottom: 0,
                zIndex: -1,
              }}
            />
          </Activity>
        </Grid>
        <Grid
          size={{ xs: 12, lg: 6 }}
          p={{ xs: 2, sm: 4, md: 8, lg: 0 }}
          pr={{ lg: 10 }}
        >
          <Box
            display="flex"
            alignItems="center"
            height="100%"
            px={{ xs: 2, md: 4, lg: 0 }}
          >
            <Stack spacing={{ xs: 4, md: 6, lg: 10 }}>
              {/* Headline */}
              <Stack spacing={{ xs: 0.5, md: 1 }}>
                <Typography
                  sx={{
                    fontSize: {
                      xs: "1.6rem",
                      sm: "1.9rem",
                      md: "2.2rem",
                      lg: "2.5rem",
                    },
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                >
                  Complete projects faster,
                </Typography>

                <Typography
                  sx={{
                    fontSize: {
                      xs: "1.2rem",
                      sm: "1.5rem",
                      md: "1.8rem",
                      lg: "2.5rem",
                    },
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                  color="red"
                >
                  without errors!
                </Typography>
              </Stack>

              {/* Description */}
              <Stack spacing={{ xs: 2, md: 3, lg: 4 }}>
                <Typography
                  sx={{
                    fontSize: {
                      xs: "0.90rem",
                      md: "0.95rem",
                      lg: "1rem",
                    },
                    lineHeight: 1.6,
                  }}
                >
                  This innovative tool is set to transform how site supervisors,
                  project managers, and engineers conduct autolevel surveys for
                  roads and waterways.
                </Typography>

                <Typography
                  sx={{
                    fontSize: {
                      xs: "0.90rem",
                      md: "0.95rem",
                      lg: "1rem",
                    },
                    lineHeight: 1.6,
                  }}
                >
                  CADer significantly streamlines the surveying process, helping
                  professionals achieve a 40% reduction in time spent on-site
                  while ensuring zero errors in their calculations
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Box ref={containerRef} width="100%" overflow={"hidden"}>
        <Stack direction="row" spacing={`${GAP}px`}>
          {Array.from({ length: tickCount }).map((_, i) => (
            <Box
              key={i}
              sx={{
                width: `${TICK_WIDTH}px`,
                height: i % 5 === 0 ? 20 : 10,
                bgcolor: "grey.700",
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box py={{ xs: 8, md: 10 }}>
        {/* Heading */}
        <Stack spacing={2} textAlign="center" mb={{ xs: 6, md: 8 }}>
          <Typography
            sx={{
              fontSize: {
                xs: "1.6rem",
                sm: "1.9rem",
                md: "2.2rem",
                lg: "2.5rem",
              },
              fontWeight: 600,
            }}
          >
            There’s{" "}
            <Box component="span" sx={{ color: "error.main" }}>
              nothing like this
            </Box>{" "}
            on
            <br />
            the market!
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: "0.90rem",
                md: "0.95rem",
                lg: "1rem",
              },
              lineHeight: 1.6,
            }}
          >
            Choosing CADer for your projects has many advantages.
            <br /> Let’s expand!
          </Typography>
        </Stack>

        {/* Features grid */}
        <Grid container spacing={{ xs: 4, md: 6 }}>
          {features.map((item, index) => (
            <Grid
              key={index}
              size={{ xs: 12, sm: 6, md: 4 }}
              display="flex"
              justifyContent="center"
            >
              <Stack
                spacing={2}
                alignItems="center"
                maxWidth={240}
                sx={{
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "translateY(-4px)" },
                  cursor: "pointer",
                }}
              >
                <Box sx={{ color: "text.primary" }}>{item.icon}</Box>

                <Typography
                  textAlign="center"
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 500,
                  }}
                >
                  {item.text}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid
        container
        spacing={{ xs: 4, md: 6 }}
        p={{ xs: 2, sm: 4, md: 8, lg: 10 }}
      >
        {/* LEFT CONTENT */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Stack spacing={{ xs: 3, md: 4 }} maxWidth={500}>
            {/* Heading */}
            <Typography
              sx={{
                fontSize: {
                  xs: "1.6rem",
                  sm: "1.9rem",
                  md: "2.2rem",
                  lg: "2.5rem",
                },
                fontWeight: 600,
              }}
            >
              CADer{" "}
              <Box component="span" sx={{ color: "error.main" }}>
                Training Program
              </Box>
            </Typography>

            {/* Intro paragraph */}
            <Typography
              sx={{
                fontSize: {
                  xs: "0.90rem",
                  md: "0.95rem",
                  lg: "1rem",
                },
                lineHeight: 1.6,
              }}
            >
              To equip your students with the cutting-edge skills needed in
              today's competitive job market, we are pleased to offer a
              specialized CADer training program for students at your esteemed
              institution.
            </Typography>

            {/* Details */}
            <Stack spacing={1.5}>
              <Typography
                sx={{
                  fontSize: {
                    xs: "0.90rem",
                    md: "0.95rem",
                    lg: "1rem",
                  },
                }}
                fontWeight={600}
              >
                Exclusive Student Training Program Details:
              </Typography>

              <Typography>
                <Box component="span" fontWeight={600}>
                  Duration:
                </Box>{" "}
                10-day intensive training package.
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.90rem",
                    md: "0.95rem",
                    lg: "1rem",
                  },
                }}
              >
                <Box component="span" fontWeight={600}>
                  Pricing:
                </Box>{" "}
                A very affordable pricing per student.
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.90rem",
                    md: "0.95rem",
                    lg: "1rem",
                  },
                }}
              >
                <Box component="span" fontWeight={600}>
                  Benefits:
                </Box>{" "}
                Upon completion, students will receive 6 months of free access
                to our software (which typically retails for ₹45,000 +
                GST/year).
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "0.90rem",
                    md: "0.95rem",
                    lg: "1rem",
                  },
                }}
              >
                <Box component="span" fontWeight={600}>
                  Career Impact:
                </Box>{" "}
                According to industry feedback, proficiency with CADer can
                increase a professional's pay scale by up to 20% based on their
                skill level.
              </Typography>
            </Stack>

            <Button
              variant="contained"
              sx={{
                backgroundColor: "red",
                borderRadius: 0,
                py: 2,
                px: 5,
                width: "fit-content",
                textTransform: "none",
                zIndex: 1,
              }}
              onClick={() => handleNavigate("/register")}
            >
              Enroll Now!
            </Button>
          </Stack>
        </Grid>

        <Activity mode={isLgDown ? "hidden" : "visible"}>
          <Grid size={{ xs: 12, lg: 6 }} position={"relative"}>
            <Box display={"flex"} justifyContent={"center"}>
              <img
                src={SURVEYOR}
                alt="surveyor"
                style={{
                  width: "450px",
                  height: "710px",
                  position: "absolute",
                  bottom: -80,
                  right: "80px",
                }}
              />

              <img
                src={CONTOUR_LINES_2}
                alt="contour_lines"
                style={{
                  height: "400px",
                  position: "absolute",
                  right: 0,
                  top: 150,
                  zIndex: -1,
                }}
              />
            </Box>
          </Grid>
        </Activity>
      </Grid>

      <Grid
        container
        sx={{
          display: "flex",
          height: "100%", // let it take parent's height
          alignItems: "stretch", // make all children stretch
        }}
      >
        <Grid size={{ xs: 12, lg: 6 }} sx={{ display: "flex" }}>
          <Activity mode={isLgDown ? "hidden" : "visible"}>
            <img
              src={ENGINEERS}
              alt="engineers"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Activity>
        </Grid>

        <Grid
          position={"relative"}
          size={{ xs: 12, lg: 6 }}
          sx={{ display: "flex", backgroundColor: "blue" }}
        >
          <img
            src={CONTOUR_LINES_2}
            alt="contour_lines"
            style={{
              width: "100%",
              height: isLgDown ? "700px" : "100%",
              objectFit: "cover",
            }}
          />

          <Stack
            position="absolute"
            zIndex={1}
            p={4}
            spacing={3}
            bgcolor="#ff8100"
            color="white"
            top="50%"
            sx={{
              transform: {
                xs: "translate(-50%, -50%)",
                lg: "translateY(-50%)",
              },
              left: {
                xs: "50%",
                lg: -65,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: "1.6rem",
                  sm: "1.9rem",
                  md: "2.2rem",
                  lg: "2.5rem",
                },
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              Connect with us
            </Typography>

            <Typography
              sx={{
                fontSize: {
                  xs: "0.90rem",
                  md: "0.95rem",
                  lg: "1rem",
                },
                lineHeight: 1.6,
              }}
            >
              Let us know how we can help! Fill out the form below to connect us
              via mali.
            </Typography>

            <Stack spacing={1}>
              {inputData.map((input, idx) => (
                <BasicInput {...input} sx={{ width: "100%" }} key={idx} />
              ))}
            </Stack>

            <Button
              variant="contained"
              sx={{
                backgroundColor: "blue",
                borderRadius: 0,
                py: 2,
                px: 5,
                width: "fit-content",
                textTransform: "none",
                zIndex: 1,
              }}
            >
              Submit
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box
        sx={{
          color: "white",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#020b7c",
            color: "white",
            px: { xs: 3, md: 10 },
            py: { xs: 5, md: 6 },
          }}
        >
          <Grid container spacing={4}>
            {/* LEFT */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2}>
                <img src={LOGO2} alt="CADer" style={{ width: 150 }} />

                <Stack direction="row" spacing={2}>
                  <FaInstagram size={20} />
                  <FaFacebookF size={20} />
                  <FaTwitter size={20} />
                </Stack>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={2}>
                {/* CENTER */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1.5}>
                    {["Home", "Partners", "Contact us", "Academy"].map(
                      (item) => (
                        <Link
                          key={item}
                          href="#"
                          underline="none"
                          color="white"
                          sx={{
                            fontSize: "0.95rem",
                            "&:hover": { opacity: 0.8 },
                          }}
                        >
                          {item}
                        </Link>
                      )
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack spacing={1.5}>
                    <Typography fontSize="0.95rem">
                      Contact: <strong>235467890</strong>
                    </Typography>
                    <Typography fontSize="0.95rem">
                      Mail: <strong>asa@getcader.com</strong>
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ backgroundColor: "#0a0b61ff", py: 2 }}>
          <Typography textAlign="center" variant="body2">
            © {new Date().getFullYear()} CADer. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Landing;
