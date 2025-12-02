import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';

export default function OutlinedCard({ card, selected, onClick }) {
  return (
    <Box
      maxWidth={154}
      className="landing-card"
      onClick={() => onClick(card.id)}
    >
      <Card className={`card-wrapper ${selected ? 'active' : ''}`}>
        <CardContent className="card-content">
          <Stack alignItems={'center'} spacing={1}>
            <Box className="icon-bg-area">{card.icon}</Box>
            <Typography fontSize={'12px'} fontWeight={700} textAlign={'center'}>
              {card.title}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
