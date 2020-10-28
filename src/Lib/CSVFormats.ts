import {CSVFormat} from "./types"
import {zip} from "lodash"

export const CSVFormats:{[key:string]:CSVFormat} = {


    webOfScience: {
        label: "Web of Science",
        url: "",
        separator: "\t",
        mandatoryFields: [
            {
                variableName: "references",
                key: "CR",
                separator: ";"
            },
            {
                variableName: "year",
                key: "PY",
            }
        ],

        metadataFields: [
            {
                variableName: "authors",
                key: "AF",
                separator: ";"
            },
            {
                variableName: "source",
                key: "SO",
            },
            {
                variableName: "author_keywords",
                key: "DE",
                separator: ";"
            },
            {
                variableName: "index_keywords",
                key: "ID",
                separator: ";"
            },
            {
                variableName: "affiliations",
                key: "C1",
                separator: ";"
            },
            {
                variableName: "funding",
                key: "FU",
                separator: ";"
            },
            {
                variableName: "subjects",
                key: "WC",
                separator: ";"
            }
        ],

        generatedFields:[
            {
                // generate from "affiliations"
                variableName: "institutions",
            },
            {
                // generate from "affiliations"
                variableName: "countries",
            },
            {
                // generate from "funding"
                variableName: "funders",
            }
        ]
    },


    scopus: {
        label: "Scopus",
        url: "",
        separator: ",",
        mandatoryFields: [
            {
                variableName: "references",
                key: "References",
                separator: ";"
            },
            {
                variableName: "year",
                key: "Year",
            }
        ],

        metadataFields: [
            {
                variableName: "authors",
                key: "Authors",
                separator: ","
            }, 
            {
                variableName: "authorsID",
                key: "Author(s) ID",
                separator: ";"
            },
            {
                variableName: "source",
                key: "SO",
            },
            {
                variableName: "author_keywords",
                key: "Author Keywords",
                separator: ";"
            },
            {
                variableName: "index_keywords",
                key: "Index Keywords",
                separator: ";"
            },
            {
                variableName: "affiliations",
                key: "Affiliations",
                separator: ";"
            },
            {
                variableName: "funding",
                key: "Funding Details",
                separator: ";"
            }
        ],

        generatedFields:[
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
            },
            {
                // generate from "affiliations"
                variableName: "countries",
            },
            {
                // generate from "funding"
                variableName: "funders",
            }
        ]
    }
}
