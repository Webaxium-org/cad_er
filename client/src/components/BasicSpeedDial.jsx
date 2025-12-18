import Box from "@mui/material/Box";
import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";

export default function BasicSpeedDial({ actions, direction, sx = {} }) {
  return (
    <Box sx={{ transform: "translateZ(0px)", flexGrow: 1 }}>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{
          position: "absolute",
          ...sx,
        }}
        icon={<SpeedDialIcon />}
        direction={direction}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={action.onClick}
            tooltipOpen
            slotProps={{
              tooltip: {
                title: action.name,
                placement: "left",
              },
            }}
            sx={{
              fontSize: 20,
              fontWeight: 900,

              "& .MuiSpeedDialAction-staticTooltipLabel": {
                backgroundColor: "#1976d2",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 600,
                padding: "6px 10px",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",

                /* 🔺 Arrow (does NOT affect layout) */
                "&::after": {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  right: "-6px",
                  transform: "translateY(-50%)",
                  width: 0,
                  height: 0,
                  borderTop: "6px solid transparent",
                  borderBottom: "6px solid transparent",
                  borderLeft: "6px solid #1976d2",
                },
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}
