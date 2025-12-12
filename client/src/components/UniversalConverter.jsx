import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { convertValue, unitCategories } from '../constants';

const UniversalConverter = () => {
  const [category, setCategory] = useState('length');

  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('cm');

  const [fromValue, setFromValue] = useState(1);
  const [toValue, setToValue] = useState(100);

  const categoryUnits = unitCategories[category].units;

  // 🚀 Auto recalc whenever units or category or fromValue changes
  useEffect(() => {
    const result = convertValue(category, fromUnit, toUnit, fromValue);
    setToValue(result);
  }, [category, fromUnit, toUnit, fromValue]);

  const updateFrom = (val) => {
    const num = Number(val);
    setFromValue(num);
  };

  const updateTo = (val) => {
    const num = Number(val);
    setToValue(num);

    // reverse conversion
    const result = convertValue(category, toUnit, fromUnit, num);
    setFromValue(result);
  };

  return (
    <Stack spacing={2}>
      {/* Category Dropdown */}
      <TextField
        select
        label="Category"
        value={category}
        onChange={(e) => {
          const newCat = e.target.value;
          const keys = Object.keys(unitCategories[newCat].units);

          setCategory(newCat);
          setFromUnit(keys[0]);
          setToUnit(keys[1]);
          setFromValue(1); // reset
        }}
      >
        {Object.keys(unitCategories).map((cat) => (
          <MenuItem key={cat} value={cat}>
            {unitCategories[cat].label}
          </MenuItem>
        ))}
      </TextField>

      {/* From Input */}
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          type="number"
          value={fromValue}
          onChange={(e) => updateFrom(e.target.value)}
        />

        <TextField
          select
          value={fromUnit}
          onChange={(e) => setFromUnit(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {Object.keys(categoryUnits).map((u) => (
            <MenuItem key={u} value={u}>
              {categoryUnits[u].label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Typography variant="h5" textAlign="center">
        =
      </Typography>

      {/* To Input */}
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          type="number"
          value={toValue}
          onChange={(e) => updateTo(e.target.value)}
        />

        <TextField
          select
          value={toUnit}
          onChange={(e) => setToUnit(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {Object.keys(categoryUnits).map((u) => (
            <MenuItem key={u} value={u}>
              {categoryUnits[u].label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box p={1} bgcolor="#fff3cd" borderRadius={1}>
        <Typography fontSize="14px">
          Formula: convert {categoryUnits[fromUnit].label} →{' '}
          {categoryUnits[toUnit].label}
        </Typography>
      </Box>
    </Stack>
  );
};

export default UniversalConverter;
