import { zip } from "lodash";

import { CSVFormat } from "./types";

export const CSVFormats: { [key: string]: CSVFormat } = {
  webOfScience: {
    label: "Web of Science",
    url: "",
    separator: "\t",
    mandatoryFields: [
      {
        variableName: "references",
        key: "CR",
        separator: ";",
      },
      {
        variableName: "year",
        key: "PY",
        hidden: TRUE,
      },
    ],

    metadataFields: [
      {
        variableName: "authors",
        key: "AF",
        separator: ";",
      },
      {
        variableName: "source",
        key: "SO",
      },
      {
        variableName: "authorKeywords",
        key: "DE",
        separator: ";",
      },
      {
        variableName: "indexKeywords",
        key: "ID",
        separator: ";",
      },
      {
        variableName: "subjects",
        key: "WC",
        separator: ";",
      },
      {
        variableName: "affiliations",
        key: "C1",
        separator: ";",
        hidden: TRUE,
      },
      {
        variableName: "funding",
        key: "FU",
        separator: ";",
        hidden: TRUE,
      },
      {
        variableName: "type",
        key: "DT",
        hidden: TRUE,
      },

    ],

    generatedFields: [
      {
        // generate from "affiliations"
        variableName: "institutions",
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
    mandatoryFields: [
      {
        variableName: "references",
        key: "References",
        separator: ";",
      },
      {
        variableName: "year",
        key: "Year",
        hidden: TRUE,
      },
    ],

    metadataFields: [
      {
        variableName: "authors",
        key: "Authors",
        separator: ",",
      },
      {
        variableName: "authorsID",
        key: "Author(s) ID",
        separator: ";",
      },
      {
        variableName: "source",
        key: "SO",
      },
      {
        variableName: "author_keywords",
        key: "Author Keywords",
        separator: ";",
      },
      {
        variableName: "index_keywords",
        key: "Index Keywords",
        separator: ";",
      },
      {
        variableName: "affiliations",
        key: "Affiliations",
        separator: ";",
        hidden: TRUE,
      },
      {
        variableName: "funding",
        key: "Funding Details",
        separator: ";",
        hidden: TRUE,
      },
      {
        variableName: "type",
        key: "Document Type",
        hidden: TRUE,
      },

    ],

    generatedFields: [
      {
        maker: (line: any) =>
          zip(
            line.authors as string[],
            line.authorsID.filter((id: any) => id !== "") as string[]
          ).map(([name, id]: any) => ({ label: name, key: id })),
        variableName: "authors",
      },
      {
        // generate from "affiliations"
        variableName: "institutions",
        maker: (line: any) => {
          const institution = line.affiliations?.split(",")[0];
          return { key: institution, label: institution };
        },
      },
      {
        // generate from "affiliations"
        variableName: "countries",
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
        maker: (line: any) =>
          line.fundings.map((funding: string) => {
            const f = funding.split(":")[0];
            return { key: f, label: f };
          }),
      },
    ],
  },
};
