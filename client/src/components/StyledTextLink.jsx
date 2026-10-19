import { styled } from "@mui/material/styles";

// shared styles (so both look identical)
const linkStyles = {
  fontSize: 15,
  color: "#1976d2",
  textDecoration: "none",
  position: "relative",
  transition: "color 0.2s ease",
  width: "fit-content",
  fontWeight: 500,
  cursor: "pointer",

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
};

// click version
const StyledTextLinkButton = styled("span")(linkStyles);

const StyledTextLink = ({ onClick, children }) => {
  return (
    <StyledTextLinkButton role="button" onClick={onClick}>
      {children}
    </StyledTextLinkButton>
  );
};

export default StyledTextLink;
