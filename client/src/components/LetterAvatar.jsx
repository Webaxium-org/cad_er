import Avatar from '@mui/material/Avatar';

export default function LetterAvatar({ letter, bgcolor, ...rest }) {
  return (
    <Avatar sx={{ bgcolor }} {...rest}>
      {letter}
    </Avatar>
  );
}
