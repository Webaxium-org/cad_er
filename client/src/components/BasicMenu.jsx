import { useId, useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { optionMenuHeaderSx, optionMenuItemSx, optionMenuPaperSx } from "./optionMenuStyles";

const BasicMenu = ({
  label = "Menu",
  header = "Options",
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
          border: "1px solid #6366f1",
          borderRadius: "10px",
          color: "#4f46e5",
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
              ...optionMenuPaperSx,
              ...menuSx,
            },
          },
          list: { sx: { p: 0, pb: 0.5 } },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Typography component="div" sx={optionMenuHeaderSx}>{header}</Typography>
        {items.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => handleClose(item)}
            sx={{
              ...optionMenuItemSx,
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
