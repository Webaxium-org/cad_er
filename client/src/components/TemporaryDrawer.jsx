import Drawer from '@mui/material/Drawer';

export default function TemporaryDrawer({ open, toggleDrawer, drawerList }) {
  return (
    <div>
      <Drawer open={open} onClose={toggleDrawer(false)} anchor="right">
        {drawerList}
      </Drawer>
    </div>
  );
}
