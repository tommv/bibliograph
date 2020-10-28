export interface Field {
    key: string,
    variableName: string,
    separator?: string // multivalue separator
}
export interface GeneratedField {
    maker?: Function,
    variableName: string
}

export interface CSVFormat {
    label: string,
    url?: string,
    separator: string,
    mandatoryFields: Field[],
    metadataFields: Field[],
    // fields to be generated from previously parsed fields (mandatory and metadata)
    generatedFields?: GeneratedField[]
}