import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';

export default function BasicBottomNavigation({ active, data }) {
  const [value, setValue] = React.useState(active);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <BottomNavigation
      sx={{
        width: '100%',
        bottom: 0,
        left: 0,
        bgcolor: '#fff',
        // boxShadow: '0 -4px 10px rgba(0,0,0,0.08)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',

        '& .MuiBottomNavigationAction-root': {
          color: '#9e9e9e',
          position: 'relative',
          transition: 'all 0.3s ease',
          '& .MuiSvgIcon-root': {
            fontSize: 26,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-6px',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0,
            height: 0,
            borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'all 0.3s ease',
            zIndex: -5,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 0,
            height: 0,
            borderRadius: '50%',
            backgroundColor: '#6334FA',
            transition: 'all 0.3s ease',
            zIndex: -5,
          },
        },

        '& .Mui-selected': {
          color: '#6334FA',
          fontWeight: 600,
          '&::before': {
            width: 50,
            height: 50,
          },
          '&::after': {
            width: 10,
            height: 10,
          },
        },
        '& .Mui-selected svg': { color: '#6334FA' },
      }}
      value={value}
      onChange={handleChange}
    >
      {data.map((nav) => (
        <BottomNavigationAction
          key={nav.value}
          label={nav.label}
          value={nav.value}
          icon={nav.icon}
        />
      ))}
    </BottomNavigation>
  );
}
