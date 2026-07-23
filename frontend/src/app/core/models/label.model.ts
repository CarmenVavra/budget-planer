export type LabelType = 'Fix' | 'Variabel';

export interface Label {
  id: string;
  name: string;
  type: LabelType;
  lastUsed: string | null;
}

export interface CreateLabelRequest {
  name: string;
  type: LabelType;
}

export type UpdateLabelRequest = CreateLabelRequest;
