import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { MdOutlineExpandMore } from 'react-icons/md';

const BasicAccordion = ({ summary, details, sx = {} }) => {
  return (
    <Accordion sx={sx}>
      <AccordionSummary
        expandIcon={<MdOutlineExpandMore fontSize={28} />}
        sx={{ padding: 0 }}
      >
        {summary}
      </AccordionSummary>
      <AccordionDetails>{details}</AccordionDetails>
    </Accordion>
  );
};

export default BasicAccordion;
