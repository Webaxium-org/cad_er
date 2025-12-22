import { Box, Stack } from "@mui/material";
import BackgroundImage from "../assets/background-img.png";
import logo from "../assets/logo/CADer logo-main.png";
import Sidebar from "./Sidebar";

const SmallHeader = () => {
  return (
    <Stack
      p={2}
      sx={{
        position: "relative",
        background:
          "linear-gradient(217.64deg, #0A3BAF -5.84%, #0025A0 106.73%)",
      }}
      height={"88px"}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: "200%",
          backgroundPosition: "center",
          opacity: 0.25,
          zIndex: 0,
          height: "60dvh",
          width: "100%",
        }}
      ></div>

      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
        color="white"
        zIndex={2}
      >
        <img src={logo} alt="CADer" style={{ width: "65px" }} />
        <Sidebar />
      </Box>
    </Stack>
  );
};

export default SmallHeader;
