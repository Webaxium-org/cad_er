import { useState } from "react";
import { Box, Stack, Typography, Grid } from "@mui/material";
import BackgroundImage from "../../../assets/background-img.png";
import logo from "../../../assets/logo/CADer logo-main.png";
import Sidebar from "../../../components/Sidebar";
import ImageAvatars from "../../../components/ImageAvatar";
import UnlockCourseBanner from "./UnlockCourseBanner";
import VideoItem from "./VideoItem";
import CourseUnlockModal from "./CourseUnlockModal";
import { qualificationOptions } from "../../../constants";

const courseDetails = {
  title: "AutoCAD Mastery Course",
  isPurchased: false,
  videos: [
    {
      id: 1,
      title: "Introduction to AutoCAD | Course Overview",
      duration: "12:34",
      thumbnail: "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
    },
    {
      id: 2,
      title: "2D Drawing Basics in AutoCAD",
      duration: "18:21",
      thumbnail: "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
    },
  ],
};

const StudentDashboard = ({ user }) => {
  const [course, setCourse] = useState(courseDetails);
  const [open, setOpen] = useState(false);

  const getPrice = () => {
    const priceDetails = qualificationOptions.find(
      (q) => q.label === user.qualification
    );
    if (priceDetails) {
      return priceDetails.fee - priceDetails.discount;
    }
  };

  return (
    <Stack spacing={2} sx={{ userSelect: "none" }} overflow={"hidden"}>
      <Stack
        p={2}
        height={"155px"}
        sx={{
          position: "relative",
          background:
            "linear-gradient(217.64deg, #0A3BAF -5.84%, #0025A0 106.73%)",
        }}
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
            minHeight: "165px",
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

        <Stack direction={"row"} alignItems={"center"} spacing={1} mt={2}>
          <ImageAvatars
            sx={{
              width: "48px",
              height: "48px",
              backgroundColor: "#fff",
              color: "rgba(40, 151, 255, 1)",
              "& .css-1mo2pzk-MuiSvgIcon-root-MuiAvatar-fallback": {
                width: "60%",
                height: "60%",
              },
            }}
          />

          <Box color="white">
            <Typography fontWeight={700} fontSize="14px">
              Hello,
            </Typography>
            <Typography fontWeight={700} fontSize="14px">
              {user.name}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Box className="overlapping-header">
        {!course.isPurchased && (
          <UnlockCourseBanner
            price={getPrice()}
            onUnlock={() => setOpen(true)}
          />
        )}

        <Typography fontWeight={700} mt={3} mb={1}>
          Video Classes
        </Typography>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            {course.videos.map((video) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={video.id}>
                <VideoItem video={video} isPurchased={course.isPurchased} />
              </Grid>
            ))}
          </Grid>
        </Stack>

        <CourseUnlockModal
          open={open}
          course={course}
          price={getPrice()}
          onUnlock={() => {
            setCourse({ ...course, isPurchased: true });
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      </Box>
    </Stack>
  );
};

export default StudentDashboard;
