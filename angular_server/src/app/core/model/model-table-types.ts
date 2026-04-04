/**
 * Type of action button in table row.
 */
export enum ActionType {
	// Simple action, calls handler without extra data.
	ACTION,
	// Action that calls handler with a value extracted from a field of the row item.
	DATA_ACTION,
	// Link action, uses RedirectionButton component.
	LINK
}

export interface ActionsConfig<T = any>{
	actionsHeader: string;
	actionsConfigs: Array<ActionConfig<T>>;
	actionsHeaderClassName?: string;
}
/**
 * Configuration for an action button in a table row.
 * @template T Type of row data.
 */
export interface ActionConfig<T = any> {
	// Type of the action.
	type: ActionType;
	/** Label text for the button. Can be a static string or a function that returns 
	 * string based on item. 
	 */
	label: string | ((item: T) => string);
	/**
	 * CSS class(es) for the button.
	 * Can be static string or function returning string.
	 * For LINK type, this class is passed to RedirectionButton.
	 * Unused in other types
	 */
	class?: string | ((item: T) => string);
	/**
	 * For DATA_ACTION: specifies which field of the item to pass as argument to handler.
	 * The value of this field will be extracted and passed to the onClick handler.
	 */
	dataField?: keyof T;
	/**
	 * For LINK: specifies the href. Can be static string or function returning string.
	 */
	href?: string | ((item: T) => string);
	/**
	 * For ACTION and DATA_ACTION: click handler. 
	 * For ACTION: handler receives the item.
	 * For DATA_ACTION: handler receives the value extracted from dataField.
	 */
	onClick?: (value: any) => void;
}

/**
 * Definition of a table column.
 * @template T Type of row data.
 */
export interface ColumnDefinition<T> {
	// Column header text.
	header: string;
	/**
	 * Field of the item or a function to compute cell value.
	 * If a function is provided, it receives the item and returns the value.
	 */
	field: keyof T | ((item: T) => any);
	// Optional CSS class for the cell.
	cellClass?: string;
	// Optional CSS class for the header cell.
	headerClass?: string;
	// Optional Angular icon name
	icon?: string | ((item: T) => string); 
}

/**
 * Data class for model-table component (ModelTable)
 * @template T Type of row data.
 */
export class ModelTableDataObject<TModel>{
	constructor(
		public columnDefinitions: Array<ColumnDefinition<TModel>>,
		public models: Array<TModel>,
		public actionsConfig?: ActionsConfig<TModel>,
	) {}
}