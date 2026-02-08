// Requirement Template Types

export type FieldType = 
  | 'checkbox' 
  | 'checkbox_with_level' 
  | 'select' 
  | 'number' 
  | 'text' 
  | 'ranked_list' 
  | 'requirement_level' 
  | 'brand_selector';

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  levels?: string[];
  max_items?: number;
}

export interface TemplateSection {
  key: string;
  title: string;
  fields: TemplateField[];
}

export interface TemplateData {
  sections: TemplateSection[];
}

export interface RequirementTemplate {
  id: string;
  role_key: string;
  display_name: string;
  template_data: TemplateData;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Field value types for filled profiles
export type RequirementLevel = 'required' | 'preferred' | 'not_relevant';

export interface CheckboxWithLevelValue {
  enabled: boolean;
  level?: string;
}

export interface RequirementProfileValue {
  [fieldKey: string]: 
    | boolean 
    | string 
    | number 
    | string[] 
    | CheckboxWithLevelValue
    | RequirementLevel
    | null;
}

export interface RequirementProfile {
  template_id: string;
  role_key: string;
  values: {
    [sectionKey: string]: RequirementProfileValue;
  };
  section_notes?: {
    [sectionKey: string]: string;
  };
}
