import { Tabs, Tab, Paper } from '@mui/material';
import { motion } from 'framer-motion';

const IOSegmentedTabs = ({ value, onChange, tabs }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'inline-flex',
        p: '4px',
        borderRadius: '16px',
        backgroundColor: 'rgba(234, 242, 255, 1)',
        width: 'calc(100% - 8px)',
      }}
    >
      <Tabs
        value={value}
        onChange={onChange}
        slotProps={{ indicator: { sx: { display: 'none' } } }}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          minHeight: 0,
          width: '100%',
          '& .MuiTabs-flexContainer': {
            gap: '4px',
            display: 'flex',
            justifyContent: 'space-between',
          },
        }}
      >
        {tabs.map((t, i) => (
          <Tab
            key={i}
            value={t.value}
            label={
              <motion.div
                whileHover={{ scale: 1.06 }}
                animate={value === t.value ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                {t.label}
              </motion.div>
            }
            sx={{
              textTransform: 'none',
              minHeight: '34px',
              px: 2.5,
              py: 1,
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 600,
              color: value === t.value ? '#000' : '#7b7b7b',
              backgroundColor: value === t.value ? '#fff' : 'transparent',
              transition: '0.25s',
            }}
          />
        ))}
      </Tabs>
    </Paper>
  );
};

export default IOSegmentedTabs;
