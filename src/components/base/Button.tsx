import { Button as SharedButton, type ButtonProps as SharedButtonProps } from '@/shared/ui/button';

export interface ButtonProps extends SharedButtonProps {}

export function Button(props: ButtonProps) {
  return <SharedButton {...props} />;
}
