import { CSVFormat } from "./types";
import { zip } from "lodash";

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
        variableName: "affiliations",
        key: "C1",
        separator: ";",
      },
      {
        variableName: "funding",
        key: "FU",
        separator: ";",
      },
      {
        variableName: "subjects",
        key: "WC",
        separator: ";",
      },
    ],

    generatedFields: [
      {
        // generate from "affiliations"
        variableName: "institutions",
        maker: (line: any) => {
          if (line.affiliations) {
            const institutions = line.affiliations.split("] ");
            return (institutions.length > 1
              ? institutions[1]
              : institutions[0]
            ).split(",")[0];
          }
        },
      },
      {
        // generate from "affiliations"
        variableName: "countries",
        maker: (line: any) => {
          if (line.affiliations && line.affiliations.includes(", ")) {
            const institutions = line.affiliations.split(", ");
            return institutions[institutions.length - 1];
          }
        },
      },
      {
        // generate from "funding"
        variableName: "funders",
        maker: (line: any) =>
          line.fundings.map((funding: string) => {
            if (funding.includes(" [")) return funding.split(" [")[0];
            else return funding;
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
      },
      {
        variableName: "funding",
        key: "Funding Details",
        separator: ";",
      },
    ],

    generatedFields: [
      {
        maker: (line: any) =>
          zip(
            line.authors as string[],
            line.authorsID.filter((id: any) => id !== "") as string[]
          ).map(([name, id]: any) => ({ name, id })),
        variableName: "authors",
      },
      {
        // generate from "affiliations"
        variableName: "institutions",
        maker: (line: any) => line.affiliations?.split(",")[0],
      },
      {
        // generate from "affiliations"
        variableName: "countries",
        maker: (line: any) => {
          if (line.affiliations && line.affiliations.includes(", ")) {
            const institutions = line.affiliations.split(", ");
            return institutions[institutions.length - 1];
          }
        },
      },
      {
        // generate from "funding"
        variableName: "funders",
        maker: (line: any) =>
          line.fundings.map((funding: string) => funding.split(":")[0]),
      },
    ],
  },
};
