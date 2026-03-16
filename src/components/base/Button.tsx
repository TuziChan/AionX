import { Button as ArcoButton, ButtonProps as ArcoButtonProps } from '@arco-design/web-react';

export interface ButtonProps extends ArcoButtonProps {}

export function Button(props: ButtonProps) {
  return <ArcoButton {...props} />;
}
