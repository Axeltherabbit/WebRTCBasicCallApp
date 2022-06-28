import React, { useEffect, useRef } from 'react';

type Props = { peer: any };

export const ForeignVideo: React.FC<Props> = ({ peer }) => {
  const refVideo = useRef<HTMLVideoElement>(null!);

  useEffect(() => {
    if (peer) {
      peer.on('stream', (stream) => {
        refVideo.current.srcObject = stream;
      });
    }
  }, [peer]);

  return <video autoPlay ref={refVideo} playsInline />;
};
