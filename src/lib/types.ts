import Graph from "graphology";

export const FIELD_IDS = [
  "authors",
  "countries",
  "institutions",
  "fields",
  "funders",
  "keywords",
  "records",
  "refs",
  "subfields",
  "topics",
  "years",
  "sources",
] as const;
export type FieldID = (typeof FIELD_IDS)[number];

export const BASE_TYPES = ["openAlex", "custom"] as const;
export type BaseType = (typeof BASE_TYPES)[number];

export type CustomFieldType =
  | { type: "number" }
  | { type: "boolean" }
  | { type: "terms"; separator?: string; values: Record<string, { count: number; label: string }> };
export type CustomFieldTypes = Record<string, CustomFieldType>;

export type Aggregation = {
  min: number;
  max: number;
  values: {
    lowerBound: number;
    count: number;
  }[];
};

export type FieldIndices = Record<BaseType, Record<string, Record<string, { count: number; label: string }>>>;
export type FiltersType = Record<BaseType, Record<string, number>>;
export type Aggregations = Record<BaseType, Record<string, Aggregation>>;

export type NodeAttributes = {
  entityId: string;
  label: string | null;
  dataType: string;
  color: string;
  nbArticles: number;
  size?: number;
  // Classic sigma attributes:
  x: number;
  y: number;
  fixed?: boolean;
};

export type EdgeAttributes = { weight: number };
export type BiblioGraph = Graph<NodeAttributes, EdgeAttributes>;

/**
 * OPEN ALEX DATA TYPES:
 * *********************
 */
export type Apc = {
  currency: string;
  provenance: string;
  value: number;
  value_usd: number;
};

export interface Location {
  is_accepted?: boolean;
  is_oa?: boolean;
  is_published?: boolean;
  landing_page_url?: string;
  license?: string;
  pdf_url?: string;
  source?: {
    display_name?: string;
    host_organization?: string;
    host_organization_lineage?: string[];
    host_organization_lineage_names?: string[];
    host_organization_name?: string;
    id?: string;
    is_in_doaj?: boolean;
    is_oa?: boolean;
    issn?: string[];
    issn_l?: string;
    type?: string;
  };
  version?: string;
}

export interface Topic {
  display_name: string;
  domain?: {
    display_name: string;
    id: string;
  };
  field?: {
    display_name: string;
    id: string;
  };
  id: string;
  keywords?: string[];
  subfield?: {
    display_name: string;
    id: string;
  };
}

export interface Work {
  id: string;
  display_name?: string;

  // Optional fields:
  abstract_inverted_index?: object;
  apc_list?: Apc;
  apc_paid?: Apc;
  authorships?: {
    author: {
      display_name: string;
      id: string;
      orcid?: string;
    };
    author_position: string;
    countries: string[];
    institutions?: {
      country_code: string;
      display_name: string;
      id: string;
      lineage: string[];
      ror: string;
      type: string;
    }[];
    is_corresponding: boolean;
    raw_affiliation_string?: string;
    raw_affiliation_strings: string[];
    raw_author_name: string;
  }[];
  best_oa_location?: Location;
  biblio?: {
    first_page?: string;
    issue?: string;
    last_page?: string;
    volume?: string;
  };
  cited_by_api_url?: string;
  cited_by_count?: number;
  cited_by_percentile_year?: {
    max: number;
    min: number;
  };
  concepts?: {
    display_name: string;
    id: string;
    level?: number;
    score?: number;
    wikidata?: string;
  }[];
  corresponding_author_ids?: string[];
  corresponding_institution_ids?: string[];
  countries_distinct_count?: number;
  counts_by_year?: {
    cited_by_count: number;
    works_count?: number;
    year: number;
  }[];
  created_date?: string;
  doi?: string;
  grants?: {
    award_id: string;
    funder: string;
    funder_display_name: string;
  }[];
  has_fulltext?: boolean;
  ids?: {
    crossref?: string;
    doi?: string;
    fatcat?: string;
    grid?: string;
    issn?: string[];
    issn_l?: string;
    mag?: string;
    openalex: string;
    orcid?: string;
    pmcid?: string;
    pmid?: string;
    ror?: string;
    scopus?: string;
    wikidata?: string;
    wikipedia?: string;
  };
  institutions_distinct_count?: number;
  is_paratext?: boolean;
  is_retracted?: boolean;
  keywords?: {
    display_name: string;
    id: string;
    score: number;
  }[];
  language?: string;
  locations?: Location[];
  locations_count?: number;
  mesh?: {
    descriptor_name: string;
    descriptor_ui: string;
    is_major_topic: boolean;
    qualifier_name: string;
    qualifier_ui: string;
  }[];
  ngrams_url?: string;
  open_access?: {
    any_repository_has_fulltext: boolean;
    is_oa: boolean;
    oa_status: string;
    oa_url: string;
  };
  primary_location?: Location;
  primary_topic?: Topic;
  publication_date?: string;
  publication_year?: number;
  referenced_works?: string[];
  referenced_works_count?: number;
  related_works?: string[];
  sustainable_development_goals?: {
    display_name: string;
    id: string;
    score: number;
  }[];
  title?: string;
  topics?: Topic[];
  type?: string;
  type_crossref?: string;
  updated_date?: string;
}

/**
 * CUSTOM ADDITIONAL DATA TYPES:
 * *****************************
 */
export type MetadataValue = string[] /* | number | boolean*/;
export type RichWork = Work & {
  metadata: Record<string, MetadataValue | undefined>;
};
