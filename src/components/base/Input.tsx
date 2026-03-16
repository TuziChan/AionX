import { Input as ArcoInput, InputProps as ArcoInputProps } from '@arco-design/web-react';

export interface InputProps extends ArcoInputProps {}

export function Input(props: InputProps) {
  return <ArcoInput {...props} />;
}

export const { TextArea, Search, Password } = ArcoInput;
