import { LegacyRef, useEffect, useRef } from 'react';

export const LocalVideo: React.FC<{ videoRef: LegacyRef<HTMLVideoElement> }> = ({ videoRef }) => {
  return <video width='320' height='240' muted ref={videoRef} autoPlay playsInline />;
};
