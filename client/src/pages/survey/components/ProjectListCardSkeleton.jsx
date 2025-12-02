import { Box, Skeleton, Stack, Typography } from '@mui/material';
import BasicDivider from '../../../components/BasicDevider';
import BasicCard from '../../../components/BasicCard';

export const ProjectListCardSkeleton = () => {
  return (
    <BasicCard
      content={
        <Box>
          {/* Summary Section */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Avatar Skeleton */}
            <Skeleton variant="circular" width={40} height={40} />

            {/* Project + Date */}
            <Box>
              <Skeleton variant="text" width={140} height={20} />
              <Skeleton variant="text" width={100} height={18} />
            </Box>
          </Stack>

          <BasicDivider
            borderBottomWidth={0.5}
            color="#d9d9d9"
            sx={{ mt: 2 }}
          />

          {/* Status Row */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mt={1}
          >
            <Skeleton
              variant="rounded"
              width={70}
              height={20}
              sx={{ borderRadius: '999px' }}
            />

            <Skeleton
              variant="rounded"
              width={70}
              height={20}
              sx={{ borderRadius: '999px' }}
            />
          </Stack>
        </Box>
      }
      sx={{
        borderRadius: '12px',
        boxShadow: '0px 4px 8px 0px #1c252c2a',
      }}
    />
  );
};
