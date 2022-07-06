import { useCallback, VideoHTMLAttributes } from 'react';

type VideoProps = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream | null;
};

export const VideoStream: React.FC<VideoProps> = ({ srcObject, ...props }) => {
  const refVideo = useCallback(
    (node: HTMLVideoElement) => {
      if (node) node.srcObject = srcObject;
    },
    [srcObject]
  );

  return <video ref={refVideo} {...props} />;
};
