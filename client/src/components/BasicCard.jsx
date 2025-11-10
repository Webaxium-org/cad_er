import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function BasicCard({ content }) {
  return (
    <Card>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
