import React from 'react';
import { Divider } from '@mui/material';

const BasicDivider = ({
  orientation = 'horizontal',
  color = '#e0e0e0',
  thickness = 0,
  borderBottomWidth = 0,
  margin = '16px 0',
  flexItem = false,
  style = {},
  ...props
}) => {
  return (
    <Divider
      orientation={orientation}
      flexItem={flexItem}
      sx={{
        borderColor: color,
        borderWidth: thickness,
        borderBottomWidth: borderBottomWidth,
        margin,
        ...style,
      }}
      {...props}
    />
  );
};

export default BasicDivider;
