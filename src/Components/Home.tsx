import React, { FC, useState } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { toPairs } from "lodash";

import { CSVFormats } from "../Lib/CSVFormats";
import { CSVFormat } from "../Lib/types";

import "./Home.css";

const FORMAT_PLACEHOLDER = "SELECT_A_FORMAT";

const Home: FC<{ onSubmit(files: File[], format: CSVFormat): void }> = ({
  onSubmit,
}) => {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();
  const [selectedFormat, setSelectedFormat] = useState<string>(
    FORMAT_PLACEHOLDER
  );

  const csvFiles = (acceptedFiles || []).filter(
    (file: FileWithPath) =>
      file.path && (file.path.split(".").pop() || "").toLowerCase() === "csv"
  );

  return (
    <section className="Home">
      <h1 className="center">
        <span className="hg">Bibliograph</span>
      </h1>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer id
        turpis aliquam, imperdiet ante ac, tincidunt neque. Integer gravida est
        justo, quis mattis magna mattis sed. Nunc convallis vestibulum nisl id
        cursus. Nunc eget faucibus felis, non feugiat quam. Sed finibus sem vel
        elit eleifend iaculis. Phasellus venenatis sollicitudin lacus, vel
        ultricies est ullamcorper nec. Nunc maximus euismod libero, quis iaculis
        ligula dapibus et. Sed eget tincidunt sapien, in eleifend odio. Nam
        viverra risus quis viverra tincidunt. Proin magna dolor, vehicula ut
        luctus eu, viverra id massa. Sed molestie purus vel arcu venenatis,
        dictum sagittis libero viverra. Cras sit amet justo mauris. Fusce sed
        mauris gravida, eleifend lectus non, rhoncus nulla. Maecenas eget cursus
        dui, iaculis aliquam erat. Maecenas at iaculis risus.
      </p>
      <div {...getRootProps({ className: "dropzone" })}>
        <input {...getInputProps()} />
        <p>Drag and drop here your CSV files or their folder</p>
      </div>
      <div className="center">
        <select
          className="card"
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
        >
          <option value={FORMAT_PLACEHOLDER}>Please select a format</option>
          {toPairs(CSVFormats).map(([key, format]) => (
            <option key={key} value={key}>
              {format.label}
            </option>
          ))}
        </select>
      </div>
      <div className="center">
        <button
          className="btn primary"
          disabled={!csvFiles.length || !CSVFormats[selectedFormat]}
          onClick={() => {
            if (csvFiles.length && CSVFormats[selectedFormat])
              onSubmit(csvFiles, CSVFormats[selectedFormat]);
          }}
        >
          Parse and index {csvFiles.length} CSV file
          {csvFiles.length > 1 ? "s" : ""}
        </button>
      </div>
    </section>
  );
};

export default Home;
