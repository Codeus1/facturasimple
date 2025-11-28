import React from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';

// ============================================================================
// LINK COMPONENT (Client-side navigation)
// ============================================================================

interface LinkProps extends NextLinkProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Link: React.FC<LinkProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <NextLink className={className} {...props}>
      {children}
    </NextLink>
  );
};
