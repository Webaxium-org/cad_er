import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function BasicCard({
  content,
  sx = {},
  component = 'div',
  contentSx = {},
  ...rest
}) {
  return (
    <Card component={component} sx={sx} {...rest}>
      <CardContent sx={contentSx}>{content}</CardContent>
    </Card>
  );
}
