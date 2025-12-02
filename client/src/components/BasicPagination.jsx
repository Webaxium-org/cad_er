import { Pagination } from '@mui/material';

const BasicPagination = ({ count, color, disabled = false, sx = {} }) => {
  return <Pagination count={count} color={color} disabled={disabled} sx={sx} />;
};

export default BasicPagination;
