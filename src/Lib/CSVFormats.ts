import { zip } from "lodash";

import { CSVFormat } from "./types";

export const CSVFormats: { [key: string]: CSVFormat } = {
  webOfScience: {
    label: "Web of Science",
    url: "",
    separator: "\t",
    references: {
      variableName: "references",
      variableLabel: "references",
      key: "CR",
      separator: ";",
    },
    year: {
      variableName: "year",
      variableLabel: "year",
      key: "PY",
      hidden: true,
    },
    metadataFields: [
      {
        variableName: "authors",
        variableLabel: "authors",
        key: "AF",
        separator: ";",
      },
      {
        variableName: "source",
        variableLabel: "sources",
        key: "SO",
      },
      {
        variableName: "authorKeywords",
        variableLabel: "author keywords",
        key: "DE",
        separator: ";",
      },
      {
        variableName: "indexKeywords",
        variableLabel: "index keywords",
        key: "ID",
        separator: ";",
      },
      {
        variableName: "subjects",
        variableLabel: "subject areas",
        key: "WC",
        separator: ";",
      },
      {
        variableName: "affiliations",
        variableLabel: "affiliations",
        key: "C1",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "funding",
        variableLabel: "funding",
        key: "FU",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "type",
        variableLabel: "record types",
        key: "DT",
        hidden: true,
      },
    ],

    generatedFields: [
      {
        // generate from "affiliations"
        variableName: "institutions",
        variableLabel: "affiliation institutions",
        maker: (line: any) => {
          if (line.affiliations) {
            const institutions = line.affiliations.split("] ");
            const institution = (institutions.length > 1
              ? institutions[1]
              : institutions[0]
            ).split(",")[0];
            return { key: institution, label: institution };
          }
        },
      },
      {
        // generate from "affiliations"
        variableName: "countries",
        variableLabel: "affiliation countries",
        maker: (line: any) => {
          if (line.affiliations && line.affiliations.includes(", ")) {
            const institutions = line.affiliations.split(", ");
            const country = institutions[institutions.length - 1];
            return { key: country, label: country };
          }
        },
      },
      {
        // generate from "funding"
        variableName: "funders",
        variableLabel: "funders",
        maker: (line: any) =>
          line.fundings.map((funding: string) => {
            let funder;
            if (funding.includes(" [")) funder = funding.split(" [")[0];
            else funder = funding;
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
      variableLabel: "references",
      key: "References",
      separator: ";",
    },
    year: {
      variableName: "year",
      variableLabel: "year",
      key: "Year",
      hidden: true,
    },
    metadataFields: [
      {
        variableName: "_authors",
        variableLabel: "author names",
        key: "Authors",
        separator: ",",
      },
      {
        variableName: "authorsID",
        variableLabel: "authors Scopus ID",
        key: "Author(s) ID",
        separator: ";",
      },
      {
        variableName: "source",
        variableLabel: "sources",
        key: "SO",
      },
      {
        variableName: "authorKeywords",
        variableLabel: "author keywords",
        key: "Author Keywords",
        separator: ";",
      },
      {
        variableName: "indexKeywords",
        variableLabel: "index keywords",
        key: "Index Keywords",
        separator: ";",
      },
      {
        variableName: "affiliations",
        variableLabel: "affiliations",
        key: "Affiliations",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "funding",
        variableLabel: "funding",
        key: "Funding Details",
        separator: ";",
        hidden: true,
      },
      {
        variableName: "type",
        variableLabel: "record types",
        key: "Document Type",
        hidden: true,
      },
    ],

    generatedFields: [
      {
        variableName: "authors",
        variableLabel: "authors",
        maker: (line: any) =>
          zip(
            line.authors as string[],
            line.authorsID.filter((id: any) => id !== "") as string[]
          ).map(([name, id]: any) => ({ label: name, key: id })),
      },
      {
        // generate from "affiliations"
        variableName: "institutions",
        variableLabel: "affiliation institutions",
        maker: (line: any) => {
          const institution = line.affiliations?.split(",")[0];
          return { key: institution, label: institution };
        },
      },
      {
        // generate from "affiliations"
        variableName: "countries",
        variableLabel: "affiliation countries",
        maker: (line: any) => {
          if (line.affiliations && line.affiliations.includes(", ")) {
            const institutions = line.affiliations.split(", ");
            const institution = institutions[institutions.length - 1];
            return { key: institution, label: institution };
          }
        },
      },
      {
        // generate from "funding"
        variableName: "funders",
        variableLabel: "funders",
        maker: (line: any) =>
          line.fundings.map((funding: string) => {
            const f = funding.split(":")[0];
            return { key: f, label: f };
          }),
      },
    ],
  },
};
