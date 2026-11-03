import Box from "@mui/material/Box";

import Preloader from "./Preloader";
import CustomSnackbar from "../components/CustomSnackbar";
import { Outlet } from "react-router-dom";
import BasicBottomNavigation from "../components/BasicBottomNavigation";
import PdfExportProvider from "../components/PdfExportProvider";

const RootLayout = () => {
  return (
    <PdfExportProvider>
      <Preloader />

      <Box width={"100%"}>
        {/* Global Alert Start*/}

        <CustomSnackbar />

        {/* Global Alert End*/}

        <Outlet />

        {/* <BasicBottomNavigation /> */}
      </Box>
    </PdfExportProvider>
  );
};

export default RootLayout;
