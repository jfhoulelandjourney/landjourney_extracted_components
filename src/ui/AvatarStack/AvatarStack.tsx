import React from 'react';
import { Avatar, AvatarProps, AvatarSize } from '../Avatar/Avatar';
import './AvatarStack.scss';

export interface AvatarStackProps {
  people: Omit<AvatarProps, 'size'>[];
  size?: AvatarSize;
  max?: number;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({ people, size = 'md', max = 4 }) => {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;
  return (
    <div className={'lj-avatar-stack lj-avatar-stack--' + size}>
      {visible.map((p, i) => (
        <span className="lj-avatar-stack__item" key={i}><Avatar {...p} size={size} /></span>
      ))}
      {overflow > 0 && (
        <span className="lj-avatar-stack__item">
          <Avatar initials={'+' + overflow} color="#9ca3af" size={size} />
        </span>
      )}
    </div>
  );
};
