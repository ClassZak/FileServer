#include "Functions.hpp"

void print_with_color(const char* format, int color, ...)
{
	print_color(color);

	va_list args;
	va_start(args, format);
	vprintf(format, args);
	va_end(args);

	print_color(0);
}
