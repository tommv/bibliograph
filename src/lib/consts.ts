import { FieldID, Work } from "./types";

type FieldValue = {
  id: string;
  label?: string;
};

type ValueOrArray<T> = undefined | T | T[];
type GetValue = (
  work: Work,
) => ValueOrArray<string> | ValueOrArray<FieldValue> | Promise<ValueOrArray<string> | ValueOrArray<FieldValue>>;

export async function cleanFieldValues(input: ReturnType<GetValue>): Promise<FieldValue[]> {
  const expected = await input;
  const array = Array.isArray(expected) ? expected : [expected];
  return array.flatMap((s) =>
    typeof s === "string"
      ? [
          {
            id: s,
          },
        ]
      : s
        ? [s]
        : [],
  );
}

export const FIELDS_META: Record<FieldID, { label: string; color: string; threshold: number; getValues: GetValue }> = {
  refs: {
    label: "References",
    color: "#ebebeb",
    threshold: 5000,
    getValues: (work: Work) => work.referenced_works,
  },
  // works: {
  //   label: "Works",
  //   color: "#202020",
  //   threshold: 50,
  //   getValues: (work: Work) => ({ id: work.id, label: work.display_name }),
  // },
  authors: {
    label: "Authors",
    color: "#ffe915",
    threshold: 50,
    getValues: (work: Work) =>
      work.authorships?.map(({ author }) => ({
        id: author.id,
        label: author.display_name,
      })),
  },
  sources: {
    label: "Sources",
    color: "#a7d30d",
    threshold: 50,
    getValues: (work: Work) =>
      [work.primary_location, ...(work.locations || [])].flatMap(({ source } = {}) =>
        source?.id ? [{ id: source.id, label: source.display_name }] : [],
      ),
  },
  institutions: {
    label: "Institutions",
    color: "#e22521",
    threshold: 50,
    getValues: (work: Work) =>
      work.authorships?.flatMap(({ institutions }) =>
        institutions.flatMap((institution) => ({
          id: institution.id,
          label: institution.display_name,
        })),
      ),
  },
  countries: {
    label: "Countries",
    color: "#df60bf",
    threshold: 25,
    getValues: (work: Work) => work.authorships?.flatMap(({ countries }) => countries),
  },
  funders: {
    label: "Funders",
    color: "#ff8f2e",
    threshold: 25,
    getValues: (work: Work) =>
      work.grants?.map((grant) => ({
        id: grant.funder,
        label: grant.funder_display_name,
      })),
  },
  concepts: {
    label: "Concepts",
    color: "#9dabf5",
    threshold: 200,
    getValues: (work: Work) =>
      work.concepts?.map((concept) => ({
        id: concept.id,
        label: concept.display_name,
      })),
  },
};
