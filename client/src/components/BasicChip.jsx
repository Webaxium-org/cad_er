import { Chip } from '@mui/material';

const BasicChip = ({ label, variant = 'outlined' }) => {
  return <Chip label={label} variant={'outlined'} />;
};

export default BasicChip;
