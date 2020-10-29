export interface Field {
  key: string;
  variableName: string;
  separator?: string; // multivalue separator
  hidden?: boolean;
}
export interface GeneratedField {
  maker: ({}) => { key: string; label: string };
  variableName: string;
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
