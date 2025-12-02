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
          width: '100%',
          textAlign: 'center',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      >
        <Typography fontWeight={700}>© CADer Surveying</Typography>
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
