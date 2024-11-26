import { zipObject } from "lodash";

import { FIELDS_META, cleanFieldValues } from "./consts";
import { FIELD_IDS, FieldIndices, Work } from "./types";

export async function fetchFiles(files: File[]): Promise<Work[]> {
  const works: Work[] = [];
  await Promise.all(
    files.map(async (file) => {
      const text = await file.text();
      const data = JSON.parse(text) as { results: Work[] };
      data.results.forEach((work) => works.push(work));
    }),
  );

  return works;
}

export async function indexWorks(works: Work[]): Promise<FieldIndices> {
  const indices = zipObject(
    FIELD_IDS,
    FIELD_IDS.map(() => ({})),
  ) as FieldIndices;

  for (let workIndex = 0; workIndex < works.length; workIndex++) {
    const work = works[workIndex];

    for (let fieldIndex = 0; fieldIndex < FIELD_IDS.length; fieldIndex++) {
      const field = FIELD_IDS[fieldIndex];
      const { getValues } = FIELDS_META[field];
      const values = await cleanFieldValues(getValues(work));

      values.forEach(({ id, label }) => {
        indices[field][id] = indices[field][id] || { count: 0, label };
        indices[field][id].count++;
      });
    }
  }

  return indices;
}
