import * as React from 'react';
import { Input as SharedInput, type InputProps as SharedInputProps } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export interface InputProps extends SharedInputProps {}

export function Input(props: InputProps) {
  return <SharedInput {...props} />;
}

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea(props: TextAreaProps) {
  return <Textarea {...props} />;
}

export type SearchProps = SharedInputProps;

export function Search({ type, ...props }: SearchProps) {
  return <SharedInput type={type ?? 'search'} {...props} />;
}

export type PasswordProps = SharedInputProps;

export function Password({ type, ...props }: PasswordProps) {
  return <SharedInput type={type ?? 'password'} {...props} />;
}
