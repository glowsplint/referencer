import { useState } from "react";

interface OwnerAvatarProps {
  name?: string;
  avatarUrl?: string;
}

export function OwnerAvatar({ name, avatarUrl }: OwnerAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!name) return null;

  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="w-5 h-5 rounded-full"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
      {name[0]}
    </div>
  );
}
