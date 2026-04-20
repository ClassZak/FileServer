import {
	Component,
	Input,
	ViewChild,
	ElementRef,
	Renderer2,
	ChangeDetectorRef,
	AfterViewInit,
	OnDestroy,
	OnChanges,
	SimpleChanges,
	HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { RedirectionButton } from '../redirection-button/redirection-button';
import * as fileIcons from '@ng-icons/material-file-icons/colored';
import {
	ActionConfig,
	ActionType,
	ColumnDefinition,
	ModelTableDataObject,
} from '../../core/model/model-table-types';

const MIN_COL_WIDTH = 20;
const RESIZE_DEBOUNCE_MS = 15;

@Component({
	selector: 'app-model-table',
	standalone: true,
	imports: [CommonModule, NgIconComponent, RedirectionButton],
	providers: [provideIcons(fileIcons)],
	templateUrl: './model-table.html',
	styleUrl: './model-table.css',
})
export class ModelTable<TModel>
	implements AfterViewInit, OnDestroy, OnChanges
{
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
	private resizeTimer: any;
	private manualResizeHappened = false;

	constructor(
		private renderer: Renderer2,
		private cdr: ChangeDetectorRef
	) {}

	/**
	 * Reacts to changes in the input modelTableDataObject.
	 * Resets column widths and re-initializes them after data update.
	 */
	ngOnChanges(changes: SimpleChanges): void {
		if (changes['modelTableDataObject'] && this.modelTableDataObject) {
			this.resetColumnWidths();
			setTimeout(() => {
				if (this.table?.nativeElement) {
					this.initColumnWidths();
					this.manualResizeHappened = false;
				}
			});
		}
	}

	/**
	 * After the view initializes, sets initial column widths if data is present.
	 */
	ngAfterViewInit(): void {
		try {
			if (this.modelTableDataObject?.models.length && this.table?.nativeElement) {
				this.initColumnWidths();
			}
		} catch (error) {
			console.error(error);
		}
	}

	/**
	 * Cleanup: remove global mouse listeners and clear resize timer.
	 */
	ngOnDestroy(): void {
		this.removeGlobalListeners();
		this.resizing = false;
		if (this.resizeTimer) {
			clearTimeout(this.resizeTimer);
		}
	}

	/**
	 * Remove global mouse move/up listeners.
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

	/**
	 * Initializes column widths by setting inline style width to the current client width.
	 * Prevents re‑initialization if already done.
	 */
	private initColumnWidths(): void {
		if (!this.isWidthStyleInitilized) {
			const headerCells = this.table.nativeElement.querySelectorAll('thead th');
			const bodyCells = this.table.nativeElement.querySelectorAll('tbody td');

			headerCells.forEach((el: Element) => {
				this.renderer.setStyle(el as HTMLElement, 'width', `${(el as HTMLElement).clientWidth}px`);
			});
			bodyCells.forEach((el: Element) => {
				this.renderer.setStyle(el as HTMLElement, 'width', `${(el as HTMLElement).clientWidth}px`);
			});

			this.isWidthStyleInitilized = true;
		}
	}

	/**
	 * Removes inline width styles from all header and data cells,
	 * allowing the table to fall back to automatic layout.
	 */
	private resetColumnWidths(): void {
		if (!this.table?.nativeElement) return;

		const cells = this.table.nativeElement.querySelectorAll('th, td');
		cells.forEach((cell: Element) => {
			this.renderer.removeStyle(cell as HTMLElement, 'width');
		});
		this.isWidthStyleInitilized = false;
	}

	/**
	 * Listens to window resize events with a debounce and triggers
	 * proportional adjustment of column widths.
	 */
	@HostListener('window:resize')
	onWindowResize(): void {
		console.log('window:resize');
		if (this.resizeTimer) {
			clearTimeout(this.resizeTimer);
		}
		this.resizeTimer = setTimeout(() => {
			this.adjustColumnWidthsToContainer();
		}, RESIZE_DEBOUNCE_MS);
	}

	/**
	 * Adjusts column widths proportionally so that the total width
	 * matches the container width, preserving user‑defined ratios.
	 */
	private adjustColumnWidthsToContainer(): void {
		if (
			!this.tableContainer?.nativeElement ||
			!this.table?.nativeElement ||
			this.resizing
		) {
			return;
		}

		const container = this.tableContainer.nativeElement;
		const table = this.table.nativeElement;
		const headerCells = table.querySelectorAll('thead th');
		if (headerCells.length === 0) return;

		const currentWidths: number[] = [];
		headerCells.forEach((th: Element) => {
			currentWidths.push((th as HTMLElement).getBoundingClientRect().width);
		});

		const totalWidth = currentWidths.reduce((sum, w) => sum + w, 0);
		const containerWidth = container.clientWidth;

		if (Math.abs(totalWidth - containerWidth) < 1) {
			return;
		}

		const scale = containerWidth / totalWidth;
		const newWidths = currentWidths.map((w) =>
			Math.max(MIN_COL_WIDTH, w * scale)
		);

		this.applyColumnWidths(newWidths);
	}

	/**
	 * Applies the given array of widths to header cells and all rows.
	 */
	private applyColumnWidths(widths: number[]): void {
		const table = this.table.nativeElement;
		const headerCells = table.querySelectorAll('thead th');
		const rows = table.querySelectorAll('tbody tr');

		headerCells.forEach((th: Element, index: number) => {
			if (index < widths.length) {
				this.renderer.setStyle(th as HTMLElement, 'width', `${widths[index]}px`);
			}
		});

		rows.forEach((row: Element) => {
			const cells = (row as HTMLElement).children;
			for (let i = 0; i < cells.length && i < widths.length; i++) {
				this.renderer.setStyle(cells[i] as HTMLElement, 'width', `${widths[i]}px`);
			}
		});

		this.isWidthStyleInitilized = true;
	}

	/**
	 * Checks whether the given column index is the last one,
	 * taking into account an optional actions column.
	 */
	isLastColumn(colIndex: number): boolean {
		if (!this.modelTableDataObject) return false;
		const totalColumns =
			this.modelTableDataObject.columnDefinitions.length +
			(this.modelTableDataObject.actionsConfig ? 1 : 0);
		return colIndex === totalColumns - 1;
	}

	/**
	 * Initiates a column resize operation.
	 */
	startResize(event: MouseEvent, colIndex: number): void {
		if (this.resizing) return;

		this.initColumnWidths();
		event.preventDefault();
		event.stopPropagation();

		const headerCells = this.table.nativeElement.querySelectorAll('thead th');
		if (colIndex >= headerCells.length) return;
		const header = headerCells[colIndex] as HTMLElement;

		this.currentColIndex = colIndex;
		this.resizingColIndex = colIndex;
		this.startX = event.clientX;
		this.startWidth = header.getBoundingClientRect().width;

		this.resizing = true;
		this.manualResizeHappened = true;

		this.unsubscribeMouseMove = this.renderer.listen(
			'document',
			'mousemove',
			this.onMouseMoveResize.bind(this)
		);
		this.unsubscribeMouseUp = this.renderer.listen(
			'document',
			'mouseup',
			this.onMouseUpEndResize.bind(this)
		);

		const handle = event.target as HTMLElement;
		handle.classList.add('active');
		this.resizing = true;
		const containerRect = this.tableContainer.nativeElement.getBoundingClientRect();
		this.resizeLineLeft = event.clientX - containerRect.left;
		this.setResizeLineXPos(header.getBoundingClientRect().right - containerRect.left);
		this.cdr.detectChanges();
	}

	/**
	 * Handles mouse movement during column resize.
	 */
	private onMouseMoveResize(event: MouseEvent): void {
		if (!this.resizing || this.currentColIndex === null || !this.tableContainer) return;
		const containerRect = this.tableContainer.nativeElement.getBoundingClientRect();
		this.resizeLineLeft = event.clientX - containerRect.left;
		if (this.resizeLineLeft <= 0) this.resizeLineLeft = 0;
		if (
			this.resizeLineLeft >=
			this.table!.nativeElement.getBoundingClientRect().width
		)
			this.resizeLineLeft = this.table!.nativeElement.getBoundingClientRect().width;

		this.setResizeLineXPos(this.resizeLineLeft);
		this.cdr.detectChanges();
	}

	/**
	 * Finalizes the column resize, applying new widths and cleaning up.
	 */
	private onMouseUpEndResize(event: MouseEvent): void {
		if (this.resizing && this.currentColIndex !== null) {
			const headerCells = this.table.nativeElement.querySelectorAll('thead th');
			const headerLeft = headerCells[this.currentColIndex] as HTMLElement;
			const headerRight = headerCells[this.currentColIndex + 1] as HTMLElement;
			if (!headerRight) return;
			const oldWidthOfResizingCols = headerLeft.clientWidth + headerRight.clientWidth;

			const diff = event.clientX - this.startX;
			const newWidth = Math.min(
				Math.max(MIN_COL_WIDTH, this.startWidth + diff),
				oldWidthOfResizingCols - MIN_COL_WIDTH
			);

			this.renderer.setStyle(headerLeft, 'width', `${newWidth}px`);
			this.renderer.setStyle(headerRight, 'width', `${oldWidthOfResizingCols - newWidth}px`);

			const rows = this.table.nativeElement.querySelectorAll('tbody tr');
			rows.forEach((row: Element) => {
				const cells = (row as HTMLElement).children;
				const leftCell = cells[this.currentColIndex!] as HTMLElement;
				if (leftCell)
					this.renderer.setStyle(leftCell, 'width', `${newWidth}px`);
				const rightCell = cells[this.currentColIndex! + 1] as HTMLElement;
				if (rightCell)
					this.renderer.setStyle(rightCell, 'width', `${oldWidthOfResizingCols - newWidth}px`);
			});

			this.resizing = false;
			this.resizingColIndex = null;
			this.resizeLineLeft = 0;
			this.setResizeLineXPos(0);

			this.tableContainer.nativeElement
				.querySelectorAll('.resize-handle.active')
				.forEach((el: Element) => {
					(el as HTMLElement).classList.remove('active');
				});
		}

		this.renderer.setStyle(this.resizeLine.nativeElement, 'display', 'none');

		this.unsubscribeMouseMove?.();
		this.unsubscribeMouseUp?.();
		this.currentColIndex = null;

		this.cdr.detectChanges();
	}

	/**
	 * Positions the resize guide line.
	 */
	setResizeLineXPos(xpos: number): void {
		const resizeLineRef = this.resizeLine.nativeElement;
		const elementWidth = resizeLineRef.style.width
			? parseInt(resizeLineRef.style.width)
			: resizeLineRef.clientWidth;
		resizeLineRef.style.left = `${xpos}px`;
	}

	/**
	 * Returns the icon name for a given column and model item.
	 */
	getIcon(item: TModel, col: ColumnDefinition<TModel>): string {
		if (!col.icon) return '';
		if (typeof col.icon === 'function') return col.icon(item);
		return col.icon;
	}

	/**
	 * Returns the header text for the actions column.
	 */
	getActionHeader(): string {
		if (this.modelTableDataObject?.actionsConfig)
			return this.modelTableDataObject.actionsConfig.actionsHeader;
		return 'Действия';
	}

	/**
	 * Returns the href for a link action.
	 */
	getActionHref(action: ActionConfig<TModel>, item: TModel): string {
		if (action.type === ActionType.LINK && action.href) {
			return typeof action.href === 'function' ? action.href(item) : action.href;
		}
		return '';
	}

	/**
	 * Extracts the display value for a cell.
	 */
	getCellValue(item: TModel, col: ColumnDefinition<TModel>): any {
		if (typeof col.field === 'function') {
			return col.field(item);
		}
		return (item as any)[col.field];
	}

	/**
	 * Returns the label for an action button.
	 */
	getActionLabel(action: ActionConfig<TModel>, item: TModel): string {
		return typeof action.label === 'function'
			? action.label(item)
			: action.label;
	}

	/**
	 * Returns the CSS class(es) for an action button.
	 */
	getActionClass(action: ActionConfig<TModel>, item: TModel): string {
		return typeof action.class === 'function'
			? action.class(item)
			: action.class || '';
	}

	/**
	 * Handles the click on an action button.
	 */
	handleAction(action: ActionConfig<TModel>, item: TModel): void {
		if (action.type === ActionType.ACTION && action.onClick) {
			action.onClick(item);
		} else if (
			action.type === ActionType.DATA_ACTION &&
			action.onClick &&
			action.dataField
		) {
			const value = (item as any)[action.dataField];
			action.onClick(value);
		}
	}
}