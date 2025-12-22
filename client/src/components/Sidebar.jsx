import { useState } from "react";
import TemporaryDrawer from "./TemporaryDrawer";
import DrawerList from "./DrawerList";
import { IoMenu } from "react-icons/io5";

const Sidebar = () => {
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen) => () => setOpen(newOpen);

  return (
    <>
      <TemporaryDrawer
        open={open}
        toggleDrawer={toggleDrawer}
        drawerList={<DrawerList toggleDrawer={toggleDrawer} />}
      />

      <IoMenu size={28} onClick={toggleDrawer(true)} />
    </>
  );
};

export default Sidebar;
