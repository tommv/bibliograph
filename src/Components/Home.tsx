import React, { FC } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";

import "./Home.css";

const Home: FC<{ onSubmit(paths: string[]): void }> = ({ onSubmit }) => {
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

  const csvFiles = acceptedFiles.filter(
    (file: FileWithPath) =>
      file.path && (file.path.split(".").pop() || "").toLowerCase() === "csv"
  );

  return (
    <section className="Home">
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
      <aside>
        <button disabled={!csvFiles.length}>
          Parse and index {csvFiles.length} CSV file
          {csvFiles.length > 1 ? "s" : ""}
        </button>
      </aside>
    </section>
  );
};

export default Home;
