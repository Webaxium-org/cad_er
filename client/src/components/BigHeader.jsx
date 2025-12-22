import { Box, Stack } from "@mui/material";
import BackgroundImage from "../assets/background-img.png";
import logo from "../assets/logo/CADer logo-main.png";
import Sidebar from "./Sidebar";

const BigHeader = () => {
  return (
    <Stack
      p={2}
      sx={{
        position: "relative",
        background:
          "linear-gradient(217.64deg, #0A3BAF -5.84%, #0025A0 106.73%)",
        color: "white",
      }}
      height={"45dvh"}
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
        justifyContent={"end"}
        alignItems={"center"}
        zIndex={2}
      >
        <Box>
          <Sidebar />
        </Box>
      </Box>

      <Box
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        height={"100%"}
      >
        <img
          src={logo}
          alt="CADer"
          style={{ width: "150px", paddingBottom: "65px" }}
        />
      </Box>
    </Stack>
  );
};

export default BigHeader;
