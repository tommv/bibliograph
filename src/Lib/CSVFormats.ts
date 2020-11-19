import { zip } from "lodash";

import { CSVFormat } from "./types";

export const CSVFormats: { [key: string]: CSVFormat } = {
  webOfScience: {
    label: "Web of Science",
    url: "",
    separator: "\t",
    references: {
      variableName: "references",
      variableLabel: "References",
      variableColor: "#EBEBEB",
      key: "CR",
      separator: ";",
    },
    year: {
      variableName: "year",
      variableLabel: "Year",
      key: "PY",
      hidden: true,
    },
    type: {
      variableName: "type",
      variableLabel: "Record types",
      key: "DT",
      separator: ";",
      hidden: true,
    },
    // year, title, authors used as a hash for deduplication
    hash: (line: Record<string, string>): string => line.PY + line.TI + line.AF,
    metadataFields: [
      {
        variableName: "authors",
        variableLabel: "Authors",
        variableColor: "#FFE915",
        key: "AF",
        separator: ";",
      },
      {
        variableName: "source",
        variableLabel: "Sources",
        variableColor: "#A7D30D",
        key: "SO",
      },
      {
        variableName: "authorKeywords",
        variableLabel: "Author keywords",
        variableColor: "#2883E5",
        key: "DE",
        separator: ";",
      },
      {
        variableName: "indexKeywords",
        variableLabel: "Index keywords",
        variableColor: "#37CAC0",
        key: "ID",
        separator: ";",
      },
      {
        variableName: "subjects",
        variableLabel: "Subject areas",
        variableColor: "#9DABF5",
        key: "WC",
        separator: ";",
      },
      {
        variableName: "affiliations",
        variableLabel: "Affiliations",
        key: "C1",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "fundings",
        variableLabel: "Fundings",
        key: "FU",
        separator: ";",
        hidden: true,
      },
    ],

    generatedFields: [
      {
        // generate from "affiliations"
        variableName: "institutions",
        variableLabel: "Affiliation institutions",
        variableColor: "#E22521",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] =>
          line.affiliations &&
          (line.affiliations as string[]).map((aff: string) => {
            const institutions = aff.split("] ");
            const institution = (institutions.length > 1
              ? institutions[1]
              : institutions[0]
            ).split(",")[0];
            return { key: institution?.trim(), label: institution?.trim() };
          }),
      },
      {
        // generate from "affiliations"
        variableName: "countries",
        variableLabel: "Affiliation countries",
        variableColor: "#DF60BF",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] =>
          line.affiliations &&
          (line.affiliations as string[])
            .filter((aff: string) => aff.includes(", "))
            .map((aff: string) => {
              const infos = aff.split(", ");
              const country = infos[infos.length - 1]?.trim();
              return { key: country, label: country };
            }),
      },
      {
        // generate from "funding"
        variableName: "funders",
        variableLabel: "Funders",
        variableColor: "#FF8F2E",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] =>
          line.fundings &&
          (line.fundings as string[]).map((funding: string) => {
            let funder;
            if (funding.includes(" [")) funder = funding.split(" [")[0]?.trim();
            else funder = funding?.trim();
            return { key: funder, label: funder };
          }),
      },
    ],
  },

  scopus: {
    label: "Scopus",
    url: "",
    separator: ",",
    references: {
      variableName: "references",
      variableLabel: "References",
      variableColor: "#EBEBEB",
      key: "References",
      separator: "; ",
    },
    year: {
      variableName: "year",
      variableLabel: "Year",
      key: "Year",
      hidden: true,
    },
    type: {
      variableName: "type",
      variableLabel: "Record types",
      key: "Document Type",
      hidden: true,
    },
    hash: (line: Record<string, string>): string =>
      line.Year + line.Title + line.Authors,
    metadataFields: [
      {
        variableName: "_authors",
        variableLabel: "Author names",
        key: "Authors",
        separator: ",",
        hidden: true,
      },
      {
        variableName: "_authorsID",
        variableLabel: "Authors Scopus ID",
        key: "Author(s) ID",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "source",
        variableLabel: "Sources",
        variableColor: "#A7D30D",
        key: "Source title",
      },
      {
        variableName: "authorKeywords",
        variableLabel: "Author keywords",
        variableColor: "#2883E5",
        key: "Author Keywords",
        separator: ";",
      },
      {
        variableName: "indexKeywords",
        variableLabel: "Index keywords",
        variableColor: "#37CAC0",
        key: "Index Keywords",
        separator: ";",
      },
      {
        variableName: "affiliations",
        variableLabel: "Affiliations",
        key: "Affiliations",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "fundings",
        variableLabel: "Fundings",
        key: "Funding Details",
        separator: ";",
        hidden: true,
      },
    ],

    generatedFields: [
      {
        variableName: "authors",
        variableLabel: "Authors",
        variableColor: "#FFE915",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] =>
          zip(
            line._authors as string[],
            (line._authorsID as string[]).filter(
              (id: string) => id !== ""
            ) as string[]
          ).map(([name, id]: [string | undefined, string | undefined]) => ({
            label: (name || "").trim(),
            key: (id || "").trim(),
          })),
      },
      {
        // generate from "affiliations"
        variableName: "institutions",
        variableLabel: "Affiliation institutions",
        variableColor: "#E22521",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] => {
          const institutions = (line.affiliations as string[])?.map(
            (aff: string) => aff.split(",")[0]
          );
          return institutions?.map((institution: string) => ({
            key: institution?.trim(),
            label: institution?.trim(),
          }));
        },
      },
      {
        // generate from "affiliations"
        variableName: "countries",
        variableLabel: "Affiliation countries",
        variableColor: "#DF60BF",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] =>
          line.affiliations &&
          (line.affiliations as string[])
            .filter((aff: string) => aff.includes(", "))
            .map((aff: string) => {
              const infos = aff.split(", ");
              const country = infos[infos.length - 1]?.trim();
              return { key: country, label: country };
            }),
      },
      {
        // generate from "funding"
        variableName: "funders",
        variableLabel: "Funders",
        variableColor: "#FF8F2E",
        maker: (
          line: Record<string, unknown>
        ): { key: string; label: string }[] =>
          line.fundings &&
          (line.fundings as string[]).map((funding: string) => {
            const f = funding.split(":")[0]?.trim();
            return { key: f, label: f };
          }),
      },
    ],
  },
};
