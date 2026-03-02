import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileInfo } from '../../core/model/file-info';
import { IconManager } from '../icon-manager/icon-manager';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { RedirectionButton } from '../redirection-button/redirection-button';

import * as fileIcons from '@ng-icons/material-file-icons/colored';


import { ActionConfig, ActionType, ColumnDefinition, ModelTableDataObject }
from '../../core/model/model-table-types';


@Component({
	selector: 'app-model-table',
	standalone: true,
	imports: [CommonModule, NgIconComponent, RedirectionButton],
	providers: [provideIcons(fileIcons)],
	templateUrl: './model-table.html',
	styleUrl: './model-table.css',
})
export class ModelTable<TModel> {
	ActionType = ActionType;
	@Input() modelTableDataObject?: ModelTableDataObject<TModel>;


	getIcon(item: TModel, col: ColumnDefinition<TModel>): string {
		if (!col.icon) return '';
		if (typeof col.icon === 'function')
			return col.icon(item);

		return col.icon;
	}
	getActionHeader(): string{
		if (this.modelTableDataObject?.actionsConfig)
			return this.modelTableDataObject?.actionsConfig.actionsHeader;
		else
			return 'Действия';
	}
	getActionHref(action: ActionConfig<TModel>, item: TModel): string {
		if (action.type === ActionType.LINK && action.href) {
			return typeof action.href === 'function' ? action.href(item) : action.href;
		}
		return '';
	}

	getCellValue(item: TModel, col: ColumnDefinition<TModel>): any {
		if (typeof col.field === 'function') {
			return col.field(item as any);
		}
		return (item as any)[col.field];
	}

	getActionLabel(action: ActionConfig<TModel>, item: TModel): string {
		return typeof action.label === 'function' ? action.label(item as any) : action.label;
	}

	getActionClass(action: ActionConfig<TModel>, item: TModel): string {
		return typeof action.class === 'function' ? 
			action.class(item as any) : 
			(action.class || '');
	}

	handleAction(action: ActionConfig<TModel>, item: TModel): void {
		if (action.type === ActionType.ACTION && action.onClick) {
			action.onClick(item);
		} else if (
				action.type === ActionType.DATA_ACTION && 
				action.onClick && action.dataField
			) {
			const value = (item as any)[action.dataField];
			action.onClick(value);
		}
	}
}
