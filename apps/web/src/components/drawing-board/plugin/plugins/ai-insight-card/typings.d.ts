export interface ViewConfigProps {
    title: string;
    entities: EntityOptionType[];
    time: number;
    aggregateType: DataAggregateType;
    compareToPreviousPeriod: boolean;
    refreshInterval: number;
    customPrompt?: string;
    [key: string]: any;
}

export type ConfigureType = any;
