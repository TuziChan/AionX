import { List as ArcoList, ListProps as ArcoListProps } from '@arco-design/web-react';

export interface ListProps extends ArcoListProps {}

export function List(props: ListProps) {
  return <ArcoList {...props} />;
}

export const { Item } = ArcoList;
