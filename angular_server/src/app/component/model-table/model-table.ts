import { Component, Input, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { RedirectionButton } from '../redirection-button/redirection-button';
import * as fileIcons from '@ng-icons/material-file-icons/colored';
import { ActionConfig, ActionType, ColumnDefinition, ModelTableDataObject } from '../../core/model/model-table-types';




const MIN_COL_WIDTH = 20;

@Component({
	selector: 'app-model-table',
	standalone: true,
	imports: [CommonModule, NgIconComponent, RedirectionButton],
	providers: [provideIcons(fileIcons)],
	templateUrl: './model-table.html',
	styleUrl: './model-table.css',
})
export class ModelTable<TModel> implements AfterViewInit, OnDestroy {
	ActionType = ActionType;
	@Input() modelTableDataObject?: ModelTableDataObject<TModel>;

	@ViewChild('tableContainer') tableContainer!: ElementRef<HTMLElement>;
	@ViewChild('table') table!: ElementRef<HTMLTableElement>;
	@ViewChild('resizeLine') resizeLine!: ElementRef<HTMLElement>;

	resizing = false;
	resizingColIndex: number | null = null;
	resizeLineLeft = 0;
	isWidthStyleInitilized = false;

	private currentColIndex: number | null = null;
	private startX = 0;
	private startWidth = 0;
	private unsubscribeMouseMove?: () => void;
	private unsubscribeMouseUp?: () => void;

	constructor(private renderer: Renderer2, private cdr: ChangeDetectorRef) {}
	ngOnDestroy(): void {
		this.removeGlobalListeners();
	}
	/**
	 * Remove global mouse listeners.
	 */
	private removeGlobalListeners(): void {
		if (this.unsubscribeMouseMove) {
			this.unsubscribeMouseMove();
			this.unsubscribeMouseMove = undefined;
		}
		if (this.unsubscribeMouseUp) {
			this.unsubscribeMouseUp();
			this.unsubscribeMouseUp = undefined;
		}
	}
	private initColumnWidths(): void {
		if (!this.isWidthStyleInitilized){
			const headerCells	 = this.table.nativeElement.querySelectorAll('thead th');
			const bodyCells		 = this.table.nativeElement.querySelectorAll('tbody td');
			headerCells.forEach((el)=>{
				this.renderer.setStyle(el, 'width', `${el.clientWidth}px`)
			});
			bodyCells.forEach((el)=>{
				this.renderer.setStyle(el, 'width', `${el.clientWidth}px`)
			});
	
			this.isWidthStyleInitilized = true;
		}
	}
	async ngAfterViewInit(): Promise<void> {
		try {
			if (this.modelTableDataObject?.models.length && this.table?.nativeElement)
				this.initColumnWidths();
		} catch (error) {
			console.error(error);
		}
	}

	// Определяем, является ли колонка последней (с учётом колонки действий)
	isLastColumn(colIndex: number): boolean {
		if (!this.modelTableDataObject) return false;
		const totalColumns = this.modelTableDataObject.columnDefinitions.length +
			(this.modelTableDataObject.actionsConfig ? 1 : 0);
		return colIndex === totalColumns - 1;
	}

	// Начало ресайза
	startResize(event: MouseEvent, colIndex: number): void {
		if (this.resizing)
			return;

		this.initColumnWidths();
		event.preventDefault();
		event.stopPropagation();

		const headerCells = this.table.nativeElement.querySelectorAll('thead th');
		if (colIndex >= headerCells.length) return;
		const header = headerCells[colIndex] as HTMLElement;

		this.currentColIndex = colIndex;
		this.resizingColIndex = colIndex; // для подсветки
		this.startX = event.clientX;
		this.startWidth = header.getBoundingClientRect().width; // точная визуальная ширина

		this.resizing = true;

		this.unsubscribeMouseMove = this.renderer.listen('document', 'mousemove', this.onMouseMoveResize.bind(this));
		this.unsubscribeMouseUp = this.renderer.listen('document', 'mouseup', this.onMouseUpEndResize.bind(this));

		// Подсветим активную ручку
		const handle = event.target as HTMLElement;
		handle.classList.add('active');
		this.resizing = true;
		const containerRect = this.tableContainer.nativeElement.getBoundingClientRect();
		this.resizeLineLeft = event.clientX - containerRect.left;
		this.setResizeLineXPos(header.getBoundingClientRect().right - containerRect.left);
		this.cdr.detectChanges();
	}
	
	private onMouseMoveResize(event: MouseEvent): void {
		if (!this.resizing || this.currentColIndex === null || !this.tableContainer) return;
		const containerRect = this.tableContainer.nativeElement.getBoundingClientRect();
		this.resizeLineLeft = event.clientX - containerRect.left;
		if (this.resizeLineLeft <= 0)
			this.resizeLineLeft = 0;
		if (this.resizeLineLeft >= this.table!.nativeElement.getBoundingClientRect().width)
			this.resizeLineLeft = this.table!.nativeElement.getBoundingClientRect().width;
		
		this.setResizeLineXPos(this.resizeLineLeft)
		this.cdr.detectChanges();
	}


	private onMouseUpEndResize(event: MouseEvent): void {
		if (this.resizing && this.currentColIndex !== null) {
			// Set width for header
			const headerCells = this.table.nativeElement.querySelectorAll('thead th');
			const headerLeft = headerCells[this.currentColIndex] as HTMLElement;
			const headerRight = headerCells[this.currentColIndex + 1] as HTMLElement;
			if (!headerRight) return;
			const oldWidthOfResizingCols = headerLeft.clientWidth + headerRight.clientWidth;

			const diff = event.clientX - this.startX;
			const newWidth = Math.min(Math.max(MIN_COL_WIDTH, this.startWidth + diff), oldWidthOfResizingCols - MIN_COL_WIDTH);

			this.renderer.setStyle(headerLeft, 'width', `${newWidth}px`);
			this.renderer.setStyle(headerRight, 'width', `${oldWidthOfResizingCols - newWidth}px`);

			// Set width for all cells
			const rows = this.table.nativeElement.querySelectorAll('tbody tr');
			rows.forEach(row => {
				const leftCell = row.children[this.currentColIndex!] as HTMLElement;
				if (leftCell)
					this.renderer.setStyle(leftCell, 'width', `${newWidth}px`);
				const rightCell = row.children[this.currentColIndex! + 1] as HTMLElement;
				if (rightCell)
					this.renderer.setStyle(rightCell, 'width', `${oldWidthOfResizingCols - newWidth}px`);
			});

			// Сброс состояния
			this.resizing = false;
			this.resizingColIndex = null;
			this.resizeLineLeft = 0;
			this.setResizeLineXPos(0);

			// Убираем активный класс с ручек
			this.tableContainer.nativeElement.querySelectorAll('.resize-handle.active').forEach(el => {
				el.classList.remove('active');
			});
		}

		this.renderer.setStyle(this.resizeLine.nativeElement, 'display', 'none');

		this.unsubscribeMouseMove?.();
		this.unsubscribeMouseUp?.();
		this.currentColIndex = null;

		this.cdr.detectChanges();
	}
	
	setResizeLineXPos(xpos: number) : void{
		const resizeLineRef = this.resizeLine.nativeElement;

		const elementWidth = resizeLineRef.style.width ? 
			parseInt(resizeLineRef.style.width) :
			resizeLineRef.clientWidth;

		resizeLineRef.style.left = `${(xpos).toString()}px`;
	}

	// Остальные методы (getIcon, getActionHeader, getActionHref, getCellValue, getActionLabel, getActionClass, handleAction)
	// остаются без изменений – их не трогаем.
	getIcon(item: TModel, col: ColumnDefinition<TModel>): string {
		if (!col.icon) return '';
		if (typeof col.icon === 'function') return col.icon(item);
		return col.icon;
	}

	getActionHeader(): string {
		if (this.modelTableDataObject?.actionsConfig)
			return this.modelTableDataObject.actionsConfig.actionsHeader;
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
			return col.field(item);
		}
		return (item as any)[col.field];
	}

	getActionLabel(action: ActionConfig<TModel>, item: TModel): string {
		return typeof action.label === 'function' ? action.label(item) : action.label;
	}

	getActionClass(action: ActionConfig<TModel>, item: TModel): string {
		return typeof action.class === 'function' ? action.class(item) : (action.class || '');
	}

	handleAction(action: ActionConfig<TModel>, item: TModel): void {
		if (action.type === ActionType.ACTION && action.onClick) {
			action.onClick(item);
		} else if (action.type === ActionType.DATA_ACTION && action.onClick && action.dataField) {
			const value = (item as any)[action.dataField];
			action.onClick(value);
		}
	}
}
