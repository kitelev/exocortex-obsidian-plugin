// Stub interfaces for removed block types to maintain compilation compatibility
// These are not functional - only dynamic-backlinks is supported

export interface QueryBlockConfig {
    type: 'query';
    [key: string]: any;
}

export interface PropertiesBlockConfig {
    type: 'properties';
    [key: string]: any;
}

export interface BacklinksBlockConfig {
    type: 'backlinks';
    [key: string]: any;
}

export interface ChildrenEffortsBlockConfig {
    type: 'children-efforts';
    [key: string]: any;
}

export interface ButtonsBlockConfig {
    type: 'buttons';
    [key: string]: any;
}

export interface CustomBlockConfig {
    type: 'custom';
    [key: string]: any;
}

export interface NarrowerBlockConfig {
    type: 'narrower';
    [key: string]: any;
}

export interface InstancesBlockConfig {
    type: 'instances';
    [key: string]: any;
}

export interface QueryEngineQuery {
    query: string;
    [key: string]: any;
}