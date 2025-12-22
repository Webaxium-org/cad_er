import Drawer from "@mui/material/Drawer";

export default function TemporaryDrawer({ open, toggleDrawer, drawerList }) {
  return (
    <div>
      <Drawer
        open={open}
        onClose={toggleDrawer(false)}
        anchor="right"
        sx={{ zIndex: 2001 }}
      >
        {drawerList}
      </Drawer>
    </div>
  );
}
