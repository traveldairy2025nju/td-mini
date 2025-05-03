import React from 'react';
import { AtCard } from 'taro-ui';
import './index.scss';

interface CardProps {
  title?: string;
  note?: string;
  extra?: string;
  thumb?: string;
  isFull?: boolean;
  onClick?: (event: any) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  note,
  extra,
  thumb,
  isFull = false,
  onClick,
  className,
  style,
  children
}) => {
  return (
    <AtCard
      title={title}
      note={note}
      extra={extra}
      thumb={thumb}
      isFull={isFull}
      onClick={onClick}
      className={className}
      customStyle={style}
    >
      {children}
    </AtCard>
  );
};

export default Card; 