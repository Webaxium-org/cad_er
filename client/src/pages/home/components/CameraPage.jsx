import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

const CameraPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    const camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });

    videoRef.current.srcObject = camStream;
    setStream(camStream);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    // Draw camera image
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw watermark
    ctx.font = '48px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('© CADer Surveying', canvas.width / 2, canvas.height - 50);

    const imgData = canvas.toDataURL('image/png');
    setCaptured(imgData);

    // 👉 Trigger phone download
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `photo_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: 'calc(100vh - 67px)',
        overflow: 'hidden',
      }}
    >
      {/* Video Camera Preview */}
      {!captured && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Watermark Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          width: '100%',
          opacity: 0.5,
          pointerEvents: 'none',
          backgroundColor: '#282828',
          color: 'white',
        }}
      >
        <Typography fontWeight={500}>Company: Webaxium</Typography>
        <Typography fontWeight={500}>Project: Charles</Typography>
        <Typography fontWeight={500}>Ref.No: 120</Typography>
        <Typography fontWeight={500}>Notes: TBM Over Culvert</Typography>
        <Typography fontWeight={500}>
          Date & time: {new Date().toLocaleString('en-IN')}
        </Typography>
        <Typography fontWeight={500}>WGS84: 10.24324, 76.65456 (+4m)</Typography>
        <Typography fontWeight={500}>Altitude: -72m</Typography>
        <Typography fontWeight={500}>Address: Kozhippilly, Kothamangalam 686691</Typography>
      </Box>

      {/* Capture Button */}
      {!captured && (
        <Button
          variant="contained"
          onClick={capturePhoto}
          sx={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'white',
            color: 'black',
            borderRadius: '50%',
            width: 70,
            height: 70,
          }}
        >
          ●
        </Button>
      )}

      {/* Captured Preview */}
      {captured && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            bgcolor: '#000',
          }}
        >
          <img src={captured} style={{ maxWidth: '100%', maxHeight: '100%' }} />
        </Box>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  );
};

export default CameraPage;
