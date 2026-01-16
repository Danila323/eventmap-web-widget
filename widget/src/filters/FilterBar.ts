/**
 * Панель фильтров виджета.
 */
import type { WidgetState } from '../types';

export interface FilterBarOptions {
  showPeriod?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
  categories?: string[];
}

export class FilterBar {
  private container: HTMLElement;
  private onFilterChange: (filters: Partial<WidgetState['filters']>) => void;
  private options: FilterBarOptions;

  constructor(
    container: HTMLElement,
    onFilterChange: (filters: Partial<WidgetState['filters']>) => void,
    options: FilterBarOptions = {}
  ) {
    this.container = container;
    this.onFilterChange = onFilterChange;
    this.options = {
      showPeriod: true,
      showSearch: true,
      showCategories: true,
      ...options,
    };
  }

  /**
   * Отрисовать панель фильтров.
   */
  render(): void {
    this.container.innerHTML = '';

    // Фильтр по периоду
    if (this.options.showPeriod) {
      const periodSelect = this.createPeriodSelect();
      this.container.appendChild(periodSelect);
    }

    // Фильтр по категории
    if (this.options.showCategories && this.options.categories && this.options.categories.length > 0) {
      const categorySelect = this.createCategorySelect();
      this.container.appendChild(categorySelect);
    }

    // Поиск
    if (this.options.showSearch) {
      const searchInput = this.createSearchInput();
      this.container.appendChild(searchInput);
    }
  }

  /**
   * Создать выпадающий список для периода.
   */
  private createPeriodSelect(): HTMLElement {
    const select = document.createElement('select');
    select.className = 'eventmap-filter-select';
    select.innerHTML = `
      <option value="all">Все события</option>
      <option value="today">Сегодня</option>
      <option value="tomorrow">Завтра</option>
      <option value="week">Неделя</option>
    `;

    select.addEventListener('change', () => {
      this.onFilterChange({ period: select.value as any });
    });

    return select;
  }

  /**
   * Создать выпадающий список для категорий.
   */
  private createCategorySelect(): HTMLElement {
    const select = document.createElement('select');
    select.className = 'eventmap-filter-select';
    select.innerHTML = `
      <option value="">Все категории</option>
      ${this.options.categories?.map(cat => `<option value="${cat}">${cat}</option>`).join('') || ''}
    `;

    select.addEventListener('change', () => {
      this.onFilterChange({ category: select.value || undefined });
    });

    return select;
  }

  /**
   * Создать поле поиска.
   */
  private createSearchInput(): HTMLElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'eventmap-filter-input';
    input.placeholder = 'Поиск...';

    let debounceTimer: number | undefined;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        this.onFilterChange({ search: input.value });
      }, 300);
    });

    return input;
  }

  /**
   * Обновить список категорий.
   */
  updateCategories(categories: string[]): void {
    this.options.categories = categories;
    this.render();
  }

  /**
   * Уничтожить панель фильтров.
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}
