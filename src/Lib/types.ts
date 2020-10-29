export interface Field {
  key: string;
  variableName: string;
  variableLabel: string;
  separator?: string; // multivalue separator
  hidden?: boolean;
}
export interface GeneratedField {
  maker: ({}) => { key: string; label: string };
  variableName: string;
  variableLabel: string;
}

export interface CSVFormat {
  label: string;
  url?: string;
  separator: string;
  references: Field;
  year: Field;
  metadataFields: Field[];
  // fields to be generated from previously parsed fields (mandatory and metadata)
  generatedFields?: GeneratedField[];
}

export interface FiltersType {
  // TODO
}

export interface FieldDefinition {
  key: string;
  label?: string;
  type: "string" | "number";
}

export type Aggregation = {
  min: number;
  max: number;
  values: {
    label: string;
    count: number;
  }[];
};
