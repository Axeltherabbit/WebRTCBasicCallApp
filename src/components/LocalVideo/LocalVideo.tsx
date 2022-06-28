import { LegacyRef, useEffect, useRef } from 'react';

export const LocalVideo: React.FC<{ refVideo: LegacyRef<HTMLVideoElement> }> = ({ refVideo }) => {
  return <video width='320' height='240' muted ref={refVideo} autoPlay playsInline />;
};
