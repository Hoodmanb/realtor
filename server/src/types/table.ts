export type LabelStyle = {
    font: string;
    fontSize: number;
    color: string;
};

export type BoxStyle = {
    background: string;
    borderColor: string;
    borderWidth: number;
};

export type TableItem = {
    label?: string;
    content: string | string[] | { label: string; value: string }[];
    label_style?: LabelStyle;
    content_style?: LabelStyle;
    box_style?: BoxStyle;
};