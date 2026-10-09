import { useId, useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

const BasicMenu = ({
  label = "Menu",
  items = [],
  onSelect,
  sx = {},
  menuSx = {},
  itemSx = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuId = useId();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (item) => {
    setAnchorEl(null);
    if (item && onSelect) onSelect(item);
  };

  return (
    <div>
      <Button
        variant="outlined"
        id={`${menuId}-button`}
        aria-controls={open ? `${menuId}-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          height: 40,
          width: 40,
          minWidth: 40,
          border: "1px solid #1976d2",
          borderRadius: "10px",
          color: "#1976d2",
          ...sx,
        }}
      >
        {label}
      </Button>

      <Menu
        id={`${menuId}-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose(null)}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: "visible",
              filter: "drop-shadow(0px 14px 28px rgba(15, 23, 42, 0.14))",
              mt: 1.5,
              borderRadius: "14px",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              "& .MuiAvatar-root": {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              "&::before": {
                content: '""',
                display: "block",
                position: "absolute",
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: "background.paper",
                transform: "translateY(-50%) rotate(45deg)",
                zIndex: 0,
              },
              ...menuSx,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {items.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => handleClose(item)}
            sx={{
              fontSize: 12,
              minHeight: "auto",
              py: 1,
              px: 2,
              fontWeight: 700,
              color: "#334155",
              "&:hover": {
                bgcolor: "rgba(99, 102, 241, 0.08)",
                color: "#4f46e5",
              },
              ...itemSx,
            }}
          >
            {item.label || item}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default BasicMenu;
