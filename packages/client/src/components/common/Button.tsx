import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
