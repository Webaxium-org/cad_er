import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { stopLoading } from '../../../redux/loadingSlice';

const CameraPage = () => {
  const dispatch = useDispatch();

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

    // Draw camera frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Dynamic scaling
    const baseFont = canvas.height * 0.018; // scalable font (2% of screen)
    const padding = canvas.height * 0.015; // top/bottom padding
    const lineHeight = baseFont * 1.6; // proper spacing

    const lines = [
      'Company: N/A',
      'Project: N/A',
      'Ref.No: N/A',
      'Notes: N/A',
      `Date & time: ${new Date().toLocaleString('en-IN')}`,
      'WGS84: N/A',
      'Altitude: N/A',
      'Address: N/A',
    ];

    const overlayHeight = padding * 2 + lines.length * lineHeight;

    // Background
    ctx.fillStyle = 'rgba(40,40,40,0.6)';
    ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = `${baseFont}px Arial`;
    ctx.textAlign = 'left';

    let y = canvas.height - overlayHeight + padding + baseFont;

    lines.forEach((line) => {
      ctx.fillText(line, 20, y);
      y += lineHeight;
    });

    // Export
    const imgData = canvas.toDataURL('image/png');
    setCaptured(imgData);

    // Download
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `photo_${Date.now()}.png`;
    link.click();
  };

  useEffect(() => {
    dispatch(stopLoading());
  }, []);

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
          style={{
            width: '100%',
            height: 'calc(100vh - 67px)',
            objectFit: 'cover',
          }}
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
        <Typography fontWeight={500}>Company: N/A</Typography>
        <Typography fontWeight={500}>Project: N/A</Typography>
        <Typography fontWeight={500}>Ref.No: N/A</Typography>
        <Typography fontWeight={500}>Notes: N/A</Typography>
        <Typography fontWeight={500}>
          Date & time: {new Date().toLocaleString('en-IN')}
        </Typography>
        <Typography fontWeight={500}>
          WGS84: N/A
        </Typography>
        <Typography fontWeight={500}>Altitude: N/A</Typography>
        <Typography fontWeight={500}>
          Address: N/A
        </Typography>
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
