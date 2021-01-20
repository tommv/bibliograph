export interface Field {
  key: string;
  variableName: string;
  variableLabel: string;
  variableColor?: string;
  separator?: string; // multivalue separator
  hidden?: boolean;
}
export interface GeneratedField {
  maker: (line: {
    [key: string]: string[];
  }) => { key: string; label: string }[];
  variableName: string;
  variableLabel: string;
  variableColor?: string;
}

export interface CSVFormat {
  label: string;
  url?: string;
  separator: string;
  references: Field;
  year: Field;
  type: Field;
  hash: (line: { [key: string]: string }) => string;
  metadataFields: Field[];
  // fields to be generated from previously parsed fields (mandatory and metadata)
  generatedFields?: GeneratedField[];
}

export interface FiltersType {
  [key: string]: number; // type of node : minimal number of occ
}

export interface FieldIndices {
  [field: string]: { [field: string]: number };
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
    lowerBound: number;
    count: number;
  }[];
};
