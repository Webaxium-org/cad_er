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

    // 1️⃣ Draw camera frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 2️⃣ Draw your overlay background (same as MUI Box)
    const overlayHeight = 260; // adjust if you add/remove lines
    ctx.fillStyle = 'rgba(40,40,40,0.5)'; // #282828 @ 0.5 opacity
    ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

    // 3️⃣ Draw your text lines (white, left-aligned)
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';

    const startY = canvas.height - overlayHeight + 40;
    const lineHeight = 40;

    const lines = [
      'Company: Webaxium',
      'Project: Charles',
      'Ref.No: 120',
      'Notes: TBM Over Culvert',
      `Date & time: ${new Date().toLocaleString('en-IN')}`,
      'WGS84: 10.24324, 76.65456 (+4m)',
      'Altitude: -72m',
      'Address: Kozhippilly, Kothamangalam 686691',
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 20, startY + i * lineHeight);
    });

    // 4️⃣ Export final photo
    const imgData = canvas.toDataURL('image/png');
    setCaptured(imgData);

    // 5️⃣ Trigger download
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `photo_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <Typography fontWeight={500}>Company: Webaxium</Typography>
        <Typography fontWeight={500}>Project: Charles</Typography>
        <Typography fontWeight={500}>Ref.No: 120</Typography>
        <Typography fontWeight={500}>Notes: TBM Over Culvert</Typography>
        <Typography fontWeight={500}>
          Date & time: {new Date().toLocaleString('en-IN')}
        </Typography>
        <Typography fontWeight={500}>
          WGS84: 10.24324, 76.65456 (+4m)
        </Typography>
        <Typography fontWeight={500}>Altitude: -72m</Typography>
        <Typography fontWeight={500}>
          Address: Kozhippilly, Kothamangalam 686691
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
