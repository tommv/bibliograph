import { isNil } from "lodash";

import { FieldID, RichWork, Work } from "./types";

export type FieldValue = {
  id: string;
  label?: string;
  attributes?: Record<string, string | undefined>;
};

type ValueOrArray<T> = undefined | T | T[];
export type GetValue = (
  work: RichWork,
) => ValueOrArray<string> | ValueOrArray<FieldValue> | Promise<ValueOrArray<string> | ValueOrArray<FieldValue>>;

export async function cleanFieldValues(input: ReturnType<GetValue>): Promise<FieldValue[]> {
  const expected = await input;
  const array = Array.isArray(expected) ? expected : [expected];
  return array.flatMap((s) =>
    s
      ? typeof s === "string"
        ? [
            {
              id: s,
              label: s,
            },
          ]
        : [s]
      : [],
  );
}

export const FIELDS_META: Record<
  FieldID,
  { label: string; color: string; threshold?: number; minRecords?: number; getValues: GetValue }
> = {
  authors: {
    label: "Authors",
    color: "#FFE918",
    threshold: 25,
    getValues: (work: Work) =>
      work.authorships?.map(({ author }) => ({
        id: author.id,
        label: author.display_name,
        attributes: {
          orcid: author.orcid,
        },
      })),
  },
  countries: {
    label: "Countries",
    color: "#FF9300",
    threshold: 15,
    getValues: (work: Work) => work.authorships?.flatMap(({ countries }) => countries),
  },
  institutions: {
    label: "Institutions",
    color: "#E22621",
    threshold: 25,
    getValues: (work: Work) =>
      work.authorships?.flatMap(({ institutions = [] }) =>
        institutions.flatMap((institution) => ({
          id: institution.id,
          label: institution.display_name,
        })),
      ),
  },
  fields: {
    label: "Fields",
    color: "#06B0F0",
    getValues: (work: Work) =>
      work.primary_topic?.field
        ? [
            {
              id: work.primary_topic?.field.id,
              label: work.primary_topic?.field.display_name,
            },
          ]
        : [],
  },
  funders: {
    label: "Funders",
    color: "#FF93BD",
    threshold: 25,
    getValues: (work: Work) =>
      work.grants?.map((grant) => ({
        id: grant.funder,
        label: grant.funder_display_name,
      })),
  },
  keywords: {
    label: "Keywords",
    color: "#9DABF6",
    threshold: 150,
    getValues: (work: Work) =>
      work.keywords?.map((keyword) => ({
        id: keyword.id,
        label: keyword.display_name,
      })),
  },
  records: {
    label: "Works",
    color: "#A6A6A6",
    threshold: 50,
    getValues: () => [],
  },
  refs: {
    label: "References",
    color: "#F3F3F3",
    threshold: 35000,
    minRecords: 2,
    getValues: (work: Work) => work.referenced_works,
  },
  subfields: {
    label: "Sub-fields",
    color: "#94DCF8",
    threshold: 150,
    getValues: (work: Work) =>
      work.primary_topic?.subfield
        ? [
            {
              id: work.primary_topic?.subfield.id,
              label: work.primary_topic?.subfield.display_name,
            },
          ]
        : [],
  },
  topics: {
    label: "Topics",
    color: "#CAEDFB",
    threshold: 0,
    getValues: (work: Work) =>
      work.topics?.map((topic) => ({
        id: topic.id,
        label: topic.display_name,
      })) || [],
  },
  years: {
    label: "Years",
    color: "#D86DCD",
    threshold: 15,
    getValues: (work: Work) => (!isNil(work.publication_year) ? ["" + work.publication_year] : []),
  },
  sources: {
    label: "Sources",
    color: "#A7D30E",
    threshold: 50,
    getValues: (work: Work) =>
      [work.primary_location, ...(work.locations || [])].flatMap((location) =>
        location?.source?.id ? [{ id: location.source.id, label: location.source.display_name }] : [],
      ),
  },
};

export const DEFAULT_METADATA_COLOR = "pink";
