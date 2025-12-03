// tests/ApiTest.test.js - базовые тесты без зависимостей

// Простейший тест для проверки работы Jest
describe('Базовые математические операции', () => {
    test('сложение работает корректно', () => {
        expect(1 + 1).toBe(2);
        expect(5 + 3).toBe(8);
        expect(-1 + 1).toBe(0);
    });

    test('вычитание работает корректно', () => {
        expect(5 - 3).toBe(2);
        expect(10 - 10).toBe(0);
        expect(0 - 5).toBe(-5);
    });

    test('умножение работает корректно', () => {
        expect(2 * 3).toBe(6);
        expect(5 * 0).toBe(0);
        expect(-2 * 3).toBe(-6);
    });

    test('деление работает корректно', () => {
        expect(10 / 2).toBe(5);
        expect(9 / 3).toBe(3);
        expect(5 / 2).toBe(2.5);
    });
});

// Тесты для строк
describe('Работа со строками', () => {
    test('конкатенация строк', () => {
        const result = 'Hello' + ' ' + 'World';
        expect(result).toBe('Hello World');
        expect(result).toHaveLength(11);
    });

    test('методы строк', () => {
        const str = 'React Testing';
        expect(str.toUpperCase()).toBe('REACT TESTING');
        expect(str.toLowerCase()).toBe('react testing');
        expect(str.includes('React')).toBe(true);
        expect(str.startsWith('React')).toBe(true);
    });
});

// Тесты для массивов
describe('Работа с массивами', () => {
    test('добавление элементов', () => {
        const arr = [1, 2, 3];
        arr.push(4);
        expect(arr).toEqual([1, 2, 3, 4]);
        expect(arr).toHaveLength(4);
        expect(arr[0]).toBe(1);
    });

    test('фильтрация массива', () => {
        const numbers = [1, 2, 3, 4, 5, 6];
        const even = numbers.filter(n => n % 2 === 0);
        expect(even).toEqual([2, 4, 6]);
    });

    test('преобразование массива', () => {
        const numbers = [1, 2, 3];
        const doubled = numbers.map(n => n * 2);
        expect(doubled).toEqual([2, 4, 6]);
    });
});

// Тесты для объектов
describe('Работа с объектами', () => {
    test('создание и доступ к свойствам', () => {
        const user = {
            id: 1,
            name: 'John',
            email: 'john@example.com'
        };

        expect(user.id).toBe(1);
        expect(user.name).toBe('John');
        expect(user.email).toContain('@');
        expect(user).toHaveProperty('name');
        expect(user).toMatchObject({ id: 1, name: 'John' });
    });

    test('деструктуризация объектов', () => {
        const config = {
            apiUrl: '/api',
            timeout: 5000,
            retries: 3
        };

        const { apiUrl, timeout } = config;
        expect(apiUrl).toBe('/api');
        expect(timeout).toBe(5000);
    });
});

// Асинхронные тесты
describe('Асинхронные операции', () => {
    test('Promise разрешается', () => {
        const promise = Promise.resolve('success');
        return expect(promise).resolves.toBe('success');
    });

    test('Promise отклоняется', () => {
        const promise = Promise.reject(new Error('failure'));
        return expect(promise).rejects.toThrow('failure');
    });

    test('async/await работает', async () => {
        const fetchData = () => Promise.resolve({ data: 'test' });
        const result = await fetchData();
        expect(result.data).toBe('test');
    });
});

// Тесты с моками
describe('Моки и шпионы', () => {
    test('простой mock функции', () => {
        const mockFn = jest.fn();
        mockFn('test');
        expect(mockFn).toHaveBeenCalled();
        expect(mockFn).toHaveBeenCalledWith('test');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('mock с возвращаемым значением', () => {
        const mockFn = jest.fn().mockReturnValue(42);
        expect(mockFn()).toBe(42);
    });

    test('mock реализации', () => {
        const mockFn = jest.fn().mockImplementation((a, b) => a + b);
        expect(mockFn(2, 3)).toBe(5);
    });
});

// Тесты для условных операторов
describe('Условные операторы и логика', () => {
    test('if-else условия', () => {
        const isEven = (num) => num % 2 === 0;
        expect(isEven(2)).toBe(true);
        expect(isEven(3)).toBe(false);
        expect(isEven(0)).toBe(true);
    });

    test('тернарный оператор', () => {
        const getStatus = (age) => age >= 18 ? 'adult' : 'minor';
        expect(getStatus(20)).toBe('adult');
        expect(getStatus(16)).toBe('minor');
        expect(getStatus(18)).toBe('adult');
    });
});