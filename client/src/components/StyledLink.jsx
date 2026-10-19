import { Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";

const StyledRouterLink = styled(RouterLink)(({ theme }) => ({
  fontSize: 15,
  color: "#1976d2",
  textDecoration: "none",
  position: "relative",
  transition: "color 0.2s ease",
  width: "fit-content",
  fontWeight: 500,
  "&::after": {
    content: '""',
    position: "absolute",
    width: "0%",
    height: "1px",
    bottom: 0,
    left: 0,
    backgroundColor: "#4f46e5",
    transition: "width 0.25s ease",
  },

  "&:hover": {
    color: "#4f46e5",
  },

  "&:hover::after": {
    width: "100%",
  },
}));

const StyledLink = ({ to, children }) => {
  return <StyledRouterLink to={to}>{children}</StyledRouterLink>;
};

export default StyledLink;
