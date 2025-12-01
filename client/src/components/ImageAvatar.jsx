import Avatar from '@mui/material/Avatar';

export default function ImageAvatars({ alt, src, sx = {} }) {
  return <Avatar alt={alt} src={src} sx={sx} />;
}
