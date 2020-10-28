import {CSVFormat} from "./types"
import {zip} from "lodash"

export const CSVFormats:{[key:string]:CSVFormat} = {
    webOfScience: {
        label: "Web of Science",
        url: "",
        separator: "\t",
        mandatoryFields: [
            {
                key: "CR",
                variableName: "references",
                separator: ";"
            },
            {
                key: "PY",
                variableName: "year"
            }
        ],
        metadataFields: [
            {
                key: "AU",
                variableName: "authors",
                separator: ";"
            }
        ]
    },
    scopus: {
        label: "Scopus",
        url: "",
        separator: ",",
        mandatoryFields: [
            {
                key: "References",
                variableName: "references",
                separator: ";"
            },
            {
                key: "Year",
                variableName: "year"
            },

        ],
        metadataFields: [
            {
                key: "Authors",
                variableName: "authors",
                separator: ","
            }, 
            {
                key: "Author(s) ID",
                variableName: "authorsID",
                separator: ";"
            }],
        generatedFields:[
            {
                maker: (line) =>
                    zip(line.authors, line.authorsID.filter(id => id !== '')).map(([name,id]:string[])=> ({name,id}))
                ,
                variableName: "authors",
            }
        ]

    }
}

