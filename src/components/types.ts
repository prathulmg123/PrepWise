import { ComponentType } from 'react';

export interface Tab {
  id: string;
  icon: ComponentType<any>;
  label: string;
}
